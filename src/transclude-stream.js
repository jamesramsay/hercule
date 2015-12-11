import _ from 'lodash';
import duplexer from 'duplexer2';

// TODO: remove this dependency!
import es from 'event-stream';

import RegexStream from './regex-stream';
import ResolveStream from './resolve-stream';
import InflateStream from './inflate-stream';
import IndentStream from './indent-stream';

import {grammar, linkRegExp, getLink, WHITESPACE_GROUP} from './config';

/**
* Input stream: string
*
* Output stream: string
*/

const defaultOptions = {
  input: 'link',
  output: 'content',
};

module.exports = function Transcluder(options) {
  const opt = _.merge({}, defaultOptions, options);
  const extend = {
    relativePath: opt.relativePath,
    references: opt.references || [],
    parents: opt.parents || [],
    indent: opt.indent,
  };
  const tokenizer = new RegexStream(linkRegExp, {
    match: {
      link: getLink,
      indent: `${WHITESPACE_GROUP}`,
    },
    leaveBehind: `${WHITESPACE_GROUP}`,
    extend,
  });
  const resolver = new ResolveStream(grammar);
  const inflater = new InflateStream();
  const indenter = new IndentStream();
  const stringify = es.map(function chunkToString(chunk, cb) {
    return cb(null, _.get(chunk, `${opt.output}`));
  });

  tokenizer
  .pipe(resolver)
  .pipe(inflater)
  .pipe(indenter)
  .pipe(stringify);

  return duplexer(tokenizer, stringify);
};
