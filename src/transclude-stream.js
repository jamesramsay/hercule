import _ from 'lodash';
import duplexer from 'duplexer2';

// TODO: remove this dependency!
import es from 'event-stream';

import RegexStream from './regex-stream';
import ResolveStream from './resolve-stream';
import InflateStream from './inflate-stream';
import IndentStream from './indent-stream';
import grammar from './transclude-parser';
import {getLink, LINK_REGEXP, WHITESPACE_GROUP} from './config';

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
  const extend = {
    relativePath: opt.relativePath,
    references: opt.references || [],
    parents: opt.parents || [],
    indent: opt.indent,
  };
  const tokenizer = new RegexStream(LINK_REGEXP, {
    match: {
      link: getLink,
      indent: `${WHITESPACE_GROUP}`,
    },
    leaveBehind: `${WHITESPACE_GROUP}`,
    extend,
  }, log);
  const resolver = new ResolveStream(grammar, null, log);
  const inflater = new InflateStream(null, log);
  const indenter = new IndentStream(null, log);
  const stringify = es.map(function chunkToString(chunk, cb) {
    return cb(null, _.get(chunk, `${opt.output}`));
  });

  tokenizer
  .pipe(resolver)
  .pipe(inflater)
  .pipe(indenter)
  .pipe(stringify);

  return duplexer(tokenizer, stringify);
}
