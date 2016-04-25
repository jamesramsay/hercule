import _ from 'lodash';
import duplexer from 'duplexer2';
import get from 'through2-get';
import regexpTokenizer from 'regexp-stream-tokenizer';

import ResolveStream from './resolve-stream';
import IndentStream from './indent-stream';
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

export default function Transcluder(opt) {
  const options = _.merge({}, DEFAULT_OPTIONS, opt);
  const sourcePaths = [];

  function token(match) {
    return defaultToken(match, options);
  }

  function separator(match) {
    return defaultSeparator(match);
  }

  const tokenizerOptions = { leaveBehind: `${WHITESPACE_GROUP}`, token, separator };
  const linkRegExp = _.get(options, 'linkRegExp') || defaultTokenRegExp;
  const tokenizer = regexpTokenizer(tokenizerOptions, linkRegExp);
  const resolver = new ResolveStream({ linkRegExp: options.linkRegExp, linkMatch: options.linkMatch });
  const indenter = new IndentStream();
  const stringify = get('content');

  tokenizer
  .pipe(resolver)
  .pipe(indenter)
  .pipe(stringify);

  const transcluder = duplexer(tokenizer, stringify);

  resolver.on('error', (err) => {
    transcluder.emit('error', err);
    resolver.end();
  });

  resolver.on('source', (filepath) => {
    sourcePaths.push(filepath);
  });

  transcluder.on('end', () => {
    transcluder.emit('sources', sourcePaths);
  });

  return transcluder;
}
