import es from 'event-stream';

import RegexStream from './regex-stream';
import PegStream from './peg-stream';
import ResolveStream from './resolve-stream';
import InflateStream from './inflate-stream';

import grammar from '../lib/transclude-parser';

// Link detection (including leading whitespace)
const linkRegExp = new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))/gm);
// const WHITESPACE_GROUP = 1;
// const PLACEHOLDER_GROUP = 2;
const LINK_GROUP = 3;


function transclude(input, relativePath, parents, parentRefs, logger, output) {
  const tokenizer = new RegexStream(linkRegExp, {match: 'link'});
  const parser = new PegStream(grammar, {parsed: 'link'});
  const resolver = new ResolveStream();
  const inflater = new InflateStream();

  input.pipe(tokenizer)
  .pipe(es.map(function extendWithExpressions(chunk, cb) {
    // Add relative path
    chunk.relativePath = relativePath;

    // Pluck expression to be parsed
    chunk.expression = chunk.link ? chunk.link[LINK_GROUP] : null;

    cb(null, chunk);
  }))
  .pipe(parser)
  .pipe(resolver)
  .pipe(inflater)
  .pipe(es.map(function chunkToString(chunk, cb) {
    // TODO: chunk.chunk is stupid variable naming
    cb(null, chunk.chunk);
  }))
  .pipe(output);
}

/**
* transcludeStream(input, [logger], [options], output)
*  - input (stream)
*  - log (function, optional) - Logging function accepting a string as the input
*  - options (object, optional)
*  - output (stream)
*
* returns: (string)
*   Transcluded string
*/
function transcludeStream(input, logger, options, output) {
  // TODO: argument validation
  // {input, relativePath, parents, parentRefs, logger, cb} = validateOptionalArgs args
  const relativePath = options.relativePath;
  const parents = options.parents;
  const parentRefs = options.parentRefs;

  transclude(input, relativePath, parents, parentRefs, logger, output);
}


module.exports = {
  transcludeStream,
};
