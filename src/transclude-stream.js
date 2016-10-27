import _ from 'lodash';
import duplexer from 'duplexer3';
import get from 'through2-get';
import regexpTokenizer from 'regexp-stream-tokenizer';

import ResolveStream from './resolve-stream';
import IndentStream from './indent-stream';
import TrimStream from './trim-stream';
import SourceMapStream from './source-map-stream';
import { defaultTokenRegExp, defaultToken, defaultSeparator } from './config';

/**
* Input stream: string
*
* Output stream: string
*/

// The sourceFile should be relative to the sourcePath
export default function Transcluder(source = 'input', opt) {
  const options = _.merge({}, { source }, opt);

  // Sourcemap
  const outputFile = _.get(options, 'outputFile');
  let sourceMap;

  function token(match) {
    return defaultToken(match, { source, parents: [source] });
  }

  function separator(match) {
    return defaultSeparator(match, { source, parents: [source] });
  }

  const linkRegExp = _.get(options, 'linkRegExp') || defaultTokenRegExp;
  const resolverOptions = {
    linkRegExp: options.linkRegExp,
    linkMatch: options.linkMatch,
    resolveLink: options.resolveLink,
  };

  const tokenizer = regexpTokenizer({ token, separator }, linkRegExp);
  const resolver = new ResolveStream(source, resolverOptions);
  const indenter = new IndentStream();
  const trim = new TrimStream();
  const sourcemap = new SourceMapStream(outputFile);
  const stringify = get('content');

  tokenizer
    .pipe(resolver)
    .pipe(trim)
    .pipe(indenter)
    .pipe(sourcemap)
    .pipe(stringify);

  const transcluder = duplexer(tokenizer, stringify);

  resolver.on('error', (err) => {
    transcluder.emit('error', err);
    resolver.end();
  });

  sourcemap.on('sourcemap', (generatedSourceMap) => {
    sourceMap = generatedSourceMap;
  });

  transcluder.on('end', () => {
    transcluder.emit('sources', sourceMap.sources);
    transcluder.emit('sourcemap', sourceMap);
  });

  return transcluder;
}
