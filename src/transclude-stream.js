import _ from 'lodash';
import duplexer from 'duplexer2';
import get from 'through2-get';
import regexpTokenizer from 'regexp-stream-tokenizer';

import ResolveStream from './resolve-stream';
import InflateStream from './inflate-stream';
import IndentStream from './indent-stream';
import { linkRegExp, defaultToken, defaultSeparator, WHITESPACE_GROUP } from './config';

/**
* Input stream: string
*
* Output stream: string
*/

const DEFAULT_OPTIONS = {
  input: 'link',
  output: 'content',
};

export default function Transcluder(opt, linkPaths) {
  const options = _.merge({}, DEFAULT_OPTIONS, opt);
  const source = options.source;

  function token(match) {
    return defaultToken(match, options);
  }

  function separator(match) {
    return defaultSeparator(match);
  }

  const tokenizerOptions = { leaveBehind: `${WHITESPACE_GROUP}`, token, separator };
  const tokenizer = regexpTokenizer(tokenizerOptions, options.linkRegExp || linkRegExp);
  const resolver = new ResolveStream(source, linkPaths);
  const inflater = new InflateStream({ linkRegExp: options.linkRegExp, linkMatch: options.linkMatch }, linkPaths);
  const indenter = new IndentStream();
  const stringify = get('content');

  tokenizer
  .pipe(resolver)
  .pipe(inflater)
  .pipe(indenter)
  .pipe(stringify);

  const transcluder = duplexer(tokenizer, stringify);

  resolver.on('error', (err) => {
    transcluder.emit('error', err);
    resolver.end();
  });

  inflater.on('error', (err) => {
    transcluder.emit('error', err);
    inflater.end();
  });

  return transcluder;
}
