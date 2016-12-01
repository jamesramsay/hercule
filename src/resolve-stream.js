import _ from 'lodash';
import through2 from 'through2';
import duplexer from 'duplexer3';
import regexpTokenizer from 'regexp-stream-tokenizer';

import { parseContent, resolveToReadableStream } from './resolver';
import { defaultTokenRegExp, defaultToken, defaultSeparator } from './config';

/**
* Input stream: object
* - link (string, required)
* - relativePath (string, required)
* - parents (array, required)
* - references (array, required)
*
* Output stream: object
* - chunk (string, required)
*
* Input and output properties can be altered by providing options
*/

export default function ResolveStream(source, opt) {
  const options = _.merge({}, opt);

  // Create nested duplex stream
  // TODO: rename this function for improved clarity
  function inflate(url, references, parents, indent) {
    const resolverStream = new ResolveStream(url);

    function token(match) {
      return _.merge(
        defaultToken(match, options, indent),
        {
          source: url,
          references: [...references],
          parents: [...parents, url],
        },
      );
    }

    function separator(match) {
      return defaultSeparator(match, { indent, source: url, parents: [...parents] });
    }

    const linkRegExp = _.get(options, 'linkRegExp') || defaultTokenRegExp;
    const tokenizerStream = regexpTokenizer({ token, separator }, linkRegExp);

    tokenizerStream.pipe(resolverStream);

    return duplexer({ objectMode: true }, tokenizerStream, resolverStream);
  }

  /* eslint-disable consistent-return */
  function transform(chunk, encoding, cb) {
    const transclusionLink = _.get(chunk, 'link');
    const inheritedReferences = _.get(chunk, 'references') || [];
    const parents = _.get(chunk, 'parents') || [];
    const indent = _.get(chunk, 'indent') || '';
    const self = this;

    if (!transclusionLink) return cb(null, chunk);

    //  Sourcemap
    const contentSource = {
      source,
      line: _.get(chunk, 'line'),
      column: _.get(chunk, 'column') + chunk.content.indexOf(transclusionLink),
    };

    let parsedContent;

    try {
      parsedContent = parseContent(transclusionLink, contentSource);
    } catch (ex) {
      self.push(chunk);
      self.emit('error', {
        message: 'Link could not be parsed',
        path: source,
        error: ex,
        line: contentSource.line,
        column: contentSource.column,
      });
      return cb();
    }
    const { contentLink, scopeReferences, descendantReferences } = parsedContent;

    // Inherited reference take precendence over fallback reference
    const references = [...inheritedReferences, ...scopeReferences];
    const link = _.find(references, { placeholder: contentLink.url }) || contentLink;

    // Prefer nearest inherited reference
    const nextReferences = _.uniqBy([...descendantReferences, ...inheritedReferences], 'placeholder');

    const { contentStream, resolvedUrl } = resolveToReadableStream(link, options.resolvers);
    if (_.includes(parents, resolvedUrl)) {
      self.push(chunk);
      self.emit('error', {
        message: 'Circular dependency detected',
        path: resolvedUrl,
        line: link.line,
        column: link.column,
      });
      return cb();
    }

    // Resolved URL will be undefined for quoted strings: :[exmple](link || "fallback" reference:"string")
    const resolvedSource = resolvedUrl || link.source;
    const resolvedParents = resolvedSource ? parents : undefined;

    const inflater = inflate(resolvedSource, nextReferences, resolvedParents, indent);

    contentStream.on('error', (inputErr) => {
      this.emit('error', inputErr);
      cb();
    });

    inflater.on('readable', function inputReadable() {
      let content;
      while ((content = this.read()) !== null) {
        self.push(content);
      }
    });

    inflater.on('error', (inflateErr) => {
      this.emit('error', inflateErr);
      cb();
    });

    inflater.on('end', () => cb());
    contentStream.pipe(inflater);
  }

  return through2.obj(transform);
}
