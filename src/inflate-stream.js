import path from 'path';
import _ from 'lodash';
import through2 from 'through2';
import duplexer from 'duplexer2';
import regexpTokenizer from 'regexp-stream-tokenizer';

import ResolveStream from './resolve-stream';
import TrimStream from './trim-stream';

import localInflater from './inflaters/local';
import httpInflater from './inflaters/http';

import { linkRegExp, defaultToken, defaultSeparator, WHITESPACE_GROUP, LINK_TYPES } from './config';

/**
* Input stream: object
* - link (object, required)
*   - href (string, required)
*   - hrefType (enum, required)
* - parents (array, required)
* - references (array, required)
*
* Output stream: object
* - chunk (string, required)
*
* Input and output properties can be altered by providing options
*/

const DEFAULT_OPTIONS = {
  input: 'link',
  output: 'content',
};

export default function InflateStream(opt) {
  const options = _.merge({}, DEFAULT_OPTIONS, opt);

  function inflateDuplex(chunk, link) {
    const resolver = new ResolveStream(link.href);
    const inflater = new InflateStream();
    const trimmer = new TrimStream();

    function token(match) {
      return _.merge(defaultToken(match, options, chunk.indent), {
        relativePath: path.dirname(link.href),
        references: [...chunk.references],
        parents: [link.href, ...chunk.parents],
      });
    }

    function separator(match) {
      return _.merge(defaultSeparator(match), { indent: chunk.indent });
    }

    const tokenizerOptions = { leaveBehind: `${WHITESPACE_GROUP}`, token, separator };
    const tokenizer = regexpTokenizer(tokenizerOptions, options.linkRegExp || linkRegExp);

    trimmer.pipe(tokenizer).pipe(resolver).pipe(inflater);

    return duplexer({ objectMode: true }, trimmer, inflater);
  }

  // eslint-disable-next-line consistent-return
  function transform(chunk, encoding, cb) {
    const link = chunk[options.input];
    const parents = chunk.parents;
    const self = this;
    let input;

    if (!link) {
      this.push(chunk);
      return cb();
    }

    if (_.includes(parents, link.href)) {
      this.push(chunk);
      this.emit('error', {
        msg: 'Circular dependency detected',
        path: link.href,
      });
      return cb();
    }

    if (_.includes(_.values(LINK_TYPES), link.hrefType) === false) {
      this.push(chunk);
      return cb();
    }

    if (link.hrefType === LINK_TYPES.STRING) {
      this.push(_.assign(chunk, { [options.output]: link.href }));
      return cb();
    }

    // Inflate local or remote file streams
    const inflater = inflateDuplex(chunk, link);
    if (link.hrefType === LINK_TYPES.LOCAL) input = localInflater.call(this, link.href, chunk, cb);
    if (link.hrefType === LINK_TYPES.HTTP) input = httpInflater.call(this, link.href, chunk, cb);

    inflater
      .on('readable', function inputReadable() {
        let content;
        while ((content = this.read()) !== null) {
          self.push(content);
        }
      })
      .on('error', (err) => {
        this.emit('error', err);
        cb();
      })
      .on('end', () => cb());

    input.pipe(inflater);
  }

  return through2.obj(transform);
}
