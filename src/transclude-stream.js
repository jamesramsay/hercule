import path from 'path';

import _ from 'lodash';
import duplexer from 'duplexer2';
import get from 'through2-get';
import regexpTokenizer from 'regexp-stream-tokenizer';

import ResolveStream from './resolve-stream';
import IndentStream from './indent-stream';
import TrimStream from './trim-stream';
import SourceMapStream from './source-map-stream';
import { defaultTokenRegExp, defaultToken, defaultSeparator, WHITESPACE_GROUP } from './config';

/**
* Input stream: string
*
* Output stream: string
*/

const DEFAULT_OPTIONS = {
  input: 'link',
  output: 'content',
};

// The sourceFile should be relative to the sourcePath
export default function Transcluder(source = 'input', opt) {
  const options = _.merge({}, DEFAULT_OPTIONS, { relativePath: path.dirname(source), source }, opt);

  // Sourcemap
  const outputFile = _.get(options, 'outputFile');
  let sourceMap;

  function token(match) {
    return defaultToken(match, options);
  }

  function separator(match) {
    return defaultSeparator(match, options);
  }

  const linkRegExp = _.get(options, 'linkRegExp') || defaultTokenRegExp;
  const tokenizerOptions = {
    leaveBehind: `${WHITESPACE_GROUP}`,
    token,
    separator,
  };
  const resolverOptions = {
    linkRegExp: options.linkRegExp,
    linkMatch: options.linkMatch,
    resolveLink: options.resolveLink,
  };

  const tokenizer = regexpTokenizer(tokenizerOptions, linkRegExp);
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
