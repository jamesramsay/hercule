import through2 from 'through2';
import _ from 'lodash';
import async from 'async';
import cloneRegExp from 'clone-regexp';
import leftsplit from 'left-split';

import { resolveToReadableStream } from './resolver';
import { parseContent } from './parse';

const SYNTAX = {
  hercule: {
    REGEXP: /(^[\t ]*)?:\[.*?]\((.*?)\)/gm,
    MATCH_GROUP: 0,
    INDENT_GROUP: 1,
    LINK_GROUP: 2,
  },
  aglio: {
    REGEXP: /( *)?(<!-- include\((.*?)\) -->)/gim,
    MATCH_GROUP: 0,
    INDENT_GROUP: 1,
    LINK_GROUP: 3,
  },
  marked: {
    REGEXP: /( *)?<<\[(.*)]/gm,
    MATCH_GROUP: 0,
    INDENT_GROUP: 1,
    LINK_GROUP: 2,
  },
  multimarkdown: {
    REGEXP: /( *)?{{(.*)}}/gm,
    MATCH_GROUP: 0,
    INDENT_GROUP: 1,
    LINK_GROUP: 2,
  },
};

function shiftCursor(content, { line, column }) {
  const newLines = (content.match(/\n/g) || []).length;
  const newColumns = content.match(/.*$/g)[0].length;

  const newLine = line + newLines;
  const newColumn = newLines > 0 ? newColumns : column + newColumns;

  return { line: newLine, column: newColumn };
}

function applyReferences(chunk) {
  const { source, line, column } = chunk;
  const transclusionLink = chunk.link;
  const inheritedReferences = chunk.references;

  const {
    contentLink,
    scopeReferences,
    descendantReferences,
  } = parseContent(transclusionLink, { source, line, column });

  // Inherited reference take precendence over fallback reference
  const contextReferences = [...inheritedReferences, ...scopeReferences];
  const link =
    _.find(contextReferences, { placeholder: contentLink.url }) || contentLink;

  // Prefer nearest inherited reference
  const nextReferences = _.uniqBy(
    [...descendantReferences, ...inheritedReferences],
    'placeholder'
  );

  return { link, nextReferences };
}

export default function Transclude(source = 'string', options = {}) {
  const {
    transclusionSyntax = 'hercule',
    inheritedParents = [],
    inheritedReferences = [],
    inheritedIndent = '',
    resolvers,
  } = options;
  const { REGEXP, MATCH_GROUP, INDENT_GROUP, LINK_GROUP } = SYNTAX[
    transclusionSyntax
  ];
  const pattern = cloneRegExp(REGEXP);
  let inputBuffer = '';
  let line = 1;
  let column = 0;

  function transclude(chunk, cb) {
    const self = this;

    // eslint-disable-next-line consistent-return
    process.nextTick(() => {
      if (!chunk.link) {
        self.push(chunk);
        return cb();
      }

      const { parents, indent } = chunk;
      const sourceLine = chunk.line;
      const sourceColumn = chunk.column;
      const content = chunk.content;

      let out;
      try {
        out = applyReferences(chunk);
      } catch (error) {
        self.push(chunk.link);
        return cb({
          message: 'Link could not be parsed',
          path: source,
          error,
          line: sourceLine,
          column: sourceColumn,
        });
      }

      const { link, nextReferences } = out;
      link.content = content;

      const { contentStream, resolvedUrl } = resolveToReadableStream(
        link,
        resolvers,
        content
      );
      if (_.includes(parents, resolvedUrl)) {
        self.push(link);
        return cb({
          message: 'Circular dependency detected',
          path: resolvedUrl,
          line: link.line,
          column: link.column,
        });
      }

      // Resolved URL will be undefined for quoted strings: :[exmple](link || "fallback" reference:"string")
      const resolvedSource = resolvedUrl || link.source;
      const resolvedParents = resolvedSource ? parents : undefined;

      const nestedTransclude = new Transclude(resolvedSource, {
        transclusionSyntax,
        inheritedParents: resolvedParents,
        inheritedReferences: nextReferences,
        inheritedIndent: indent,
        resolvers,
      });

      nestedTransclude
        .on('readable', function inputReadable() {
          let streamContent;
          while ((streamContent = this.read()) !== null) {
            self.push(streamContent);
          }
        })
        .on('error', err => cb(err))
        .on('end', () => cb(null, true));
      contentStream.on('error', err => cb(err));
      contentStream.pipe(nestedTransclude);
    });
  }

  function toToken(chunk) {
    const content = chunk[MATCH_GROUP];
    const link = chunk[LINK_GROUP];
    const indent = chunk[INDENT_GROUP] || '';

    const output = { content, line, column };
    output.link = link;
    output.source = source;
    output.parents = [...inheritedParents, source];
    output.references = [...inheritedReferences];
    output.indent = inheritedIndent + indent;
    output.column += content.lastIndexOf(link);

    ({ line, column } = shiftCursor(content, { line, column }));

    return output;
  }

  function toSeparators(separator) {
    // Each line must be processed individually for correct sourcemap output
    let separators = leftsplit(separator, /(\r?\n)/);

    separators = _.map(separators, content => {
      if (!content) return null;

      const output = { content, line, column };
      output.source = source;
      output.indent = inheritedIndent;
      output.parents = [...inheritedParents];

      ({ line, column } = shiftCursor(content, { line, column }));

      return output;
    });

    return _.without(separators, null);
  }

  function tokenize(chunk) {
    const lastChunk = !chunk;
    let nextOffset = 0;
    let match = null;
    let tokens = [];

    if (chunk) inputBuffer += chunk;

    while ((match = pattern.exec(inputBuffer)) !== null) {
      // Content prior to match can be returned without transform
      if (match.index > nextOffset) {
        const separator = inputBuffer.slice(nextOffset, match.index);
        tokens = tokens.concat(toSeparators(separator));
      }

      // Match within bounds: [  xxxx  ]
      if (pattern.lastIndex < inputBuffer.length || lastChunk) {
        tokens.push(toToken(match));

        // Next match must be after this match
        nextOffset = pattern.lastIndex;
        // Match against bounds: [     xxx]
      } else {
        // Next match will be the start of this match
        nextOffset = match.index;
      }
    }

    inputBuffer = inputBuffer.slice(nextOffset);
    pattern.lastIndex = 0;

    // End of input, flush the input buffer
    if (lastChunk) tokens = tokens.concat(toSeparators(inputBuffer));

    return tokens;
  }

  // eslint-disable-next-line consistent-return
  function transform(chunk, encoding, cb) {
    // Allow objects straight through
    if (_.isPlainObject(chunk)) return cb(null, chunk);

    async.eachSeries(
      tokenize(chunk.toString('utf8')),
      (output, next) => transclude.call(this, output, next),
      err => {
        if (err) inputBuffer = '';
        cb(err);
      }
    );
  }

  function flush(cb) {
    async.eachSeries(
      tokenize(),
      (output, next) => transclude.call(this, output, next),
      err => {
        this.push(null);
        cb(err);
      }
    );
  }

  return through2.obj(transform, flush);
}
