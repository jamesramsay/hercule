import _ from 'lodash';
import duplexer from 'duplexer2';
import get from 'through2-get';
import regexpTokenizer from 'regexp-stream-tokenizer';

import ResolveStream from './resolve-stream';
import InflateStream from './inflate-stream';
import IndentStream from './indent-stream';
import grammar from './transclude-parser';
import { linkRegExp, linkMatch, WHITESPACE_GROUP } from './config';

/**
* Input stream: string
*
* Output stream: string
*/

const DEFAULT_OPTIONS = {
  input: 'link',
  output: 'content',
};

export default function Transcluder(opt, log, linkPaths) {
  const options = _.merge({}, DEFAULT_OPTIONS, opt);

  function token(match) {
    const tk = {
      content: _.get(match, '[0]'),
      link: {
        href: _.isFunction(options.linkMatch) ? options.linkMatch(match) : linkMatch(match),
      },
      indent: _([options.indent, match[WHITESPACE_GROUP]]).filter(_.isString).value().join(''),
      relativePath: options.relativePath,
      references: options.references || [],
      parents: options.parents || [],
    };
    return tk;
  }

  const tokenizerOptions = {
    leaveBehind: `${WHITESPACE_GROUP}`,
    token,
    separator: (separator) => ({
      content: separator,
      indent: options.indent,
    }),
  };
  const tokenizer = regexpTokenizer(tokenizerOptions, options.linkRegExp || linkRegExp);
  const resolver = new ResolveStream(grammar, null, log, linkPaths);
  const inflater = new InflateStream({ linkRegExp: options.linkRegExp, linkMatch: options.linkMatch }, log, linkPaths);
  const indenter = new IndentStream(null, log);
  const stringify = get('content');

  tokenizer
  .pipe(resolver)
  .pipe(inflater)
  .pipe(indenter)
  .pipe(stringify);

  return duplexer(tokenizer, stringify);
}
