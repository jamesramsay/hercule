import _ from 'lodash';
import duplexer from 'duplexer2';
import through2 from 'through2';

import RegexStream from './regex-stream';
import ResolveStream from './resolve-stream';
import InflateStream from './inflate-stream';
import IndentStream from './indent-stream';
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

export default function Transcluder(options, log) {
  const opt = _.merge({}, DEFAULT_OPTIONS, options);
  const tokenizerOptions = {
    match: LINK_MATCH,
    leaveBehind: `${WHITESPACE_GROUP}`,
    extend: {
      relativePath: opt.relativePath,
      references: opt.references || [],
      parents: opt.parents || [],
      indent: opt.indent,
    },
  };
  const tokenizer = new RegexStream(LINK_REGEXP, tokenizerOptions, log);
  const resolver = new ResolveStream(grammar, null, log);
  const inflater = new InflateStream(null, log);
  const indenter = new IndentStream(null, log);
  const stringify = through2.obj(function chunkToString(chunk, encoding, cb) {
    const content = _.get(chunk, `${opt.output}`);
    // Prevent signaling end of readable stream
    // https://nodejs.org/api/stream.html#stream_stream_push
    if (_.isString(content) && content !== '') this.push(content);
    return cb();
  })

  tokenizer
  .pipe(resolver)
  .pipe(inflater)
  .pipe(indenter)
  .pipe(stringify);

  return duplexer(tokenizer, stringify);
}
