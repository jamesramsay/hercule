import _ from 'lodash';
import duplexer from 'duplexer2';

// TODO: remove this dependency!
import es from 'event-stream';

import RegexStream from './regex-stream';
import PegStream from './peg-stream';
import ResolveStream from './resolve-stream';
import InflateStream from './inflate-stream';
import IndentStream from './indent-stream';

import {grammar, linkRegExp, LINK_GROUP, WHITESPACE_GROUP} from './config';

/**
* Input stream: string
*
* Output stream: string
*/

const defaultOptions = {
  input: 'link',
  output: 'chunk',
};

module.exports = function Transcluder(options) {
  const opt = _.merge({}, defaultOptions, options);
  const extendTokens = {
    relativePath: opt.relativePath,
    references: opt.references,
    parents: opt.parents,
  };

  const tokenizer = new RegexStream(linkRegExp, {
    match: {
      match: `${LINK_GROUP}`,
      indent: `${WHITESPACE_GROUP}`,
    },
    leaveBehind: `${WHITESPACE_GROUP}`,
    extend: extendTokens,
  });

  const parser = new PegStream(grammar);
  const resolver = new ResolveStream();
  const inflater = new InflateStream();
  const indenter = new IndentStream();
  const stringify = es.map(function chunkToString(chunk, cb) {
    // TODO: chunk.chunk is stupid variable naming
    return cb(null, chunk.chunk);
  });

  tokenizer
  .pipe(parser)
  .pipe(resolver)
  .pipe(inflater)
  .pipe(indenter)
  .pipe(stringify);

  return duplexer(tokenizer, stringify);
};
