import _ from 'lodash';
import duplexer from 'duplexer2';
import through2 from 'through2';

import RegexStream from './regex-stream';
import ResolveStream from './resolve-stream';
import InflateStream from './inflate-stream';
import IndentStream from './indent-stream';
import Get from './through2-get';
import grammar from './transclude-parser';
import {LINK_REGEXP, LINK_MATCH, WHITESPACE_GROUP} from './config';

/**
* Input stream: string
*
* Output stream: string
*/

const DEFAULT_OPTIONS = {
  input: 'link',
  output: 'content',
};

export default function Transcluder(opt, log) {
  const options = _.merge({}, DEFAULT_OPTIONS, opt);
  const tokenizerOptions = {
    match: LINK_MATCH,
    leaveBehind: `${WHITESPACE_GROUP}`,
    extend: {
      relativePath: options.relativePath,
      references: options.references || [],
      parents: options.parents || [],
      indent: options.indent,
    },
  };
  const tokenizer = new RegexStream(LINK_REGEXP, tokenizerOptions, log);
  const resolver = new ResolveStream(grammar, null, log);
  const inflater = new InflateStream(null, log);
  const indenter = new IndentStream(null, log);
  const stringify = new Get('content');

  tokenizer
  .pipe(resolver)
  .pipe(inflater)
  .pipe(indenter)
  .pipe(stringify);

  return duplexer(tokenizer, stringify);
}
