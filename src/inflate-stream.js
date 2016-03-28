import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import through2 from 'through2';
import duplexer from 'duplexer2';
import request from 'request';
import regexpTokenizer from 'regexp-stream-tokenizer';

import ResolveStream from './resolve-stream';
import TrimStream from './trim-stream';
import { linkRegExp, defaultToken, defaultSeparator, WHITESPACE_GROUP, SUPPORTED_LINK_TYPES } from './config';

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

export default function InflateStream(opt, linkPaths) {
  const options = _.merge({}, DEFAULT_OPTIONS, opt);

  function inflateDuplex(chunk, link) {
    const resolver = new ResolveStream(link.href, linkPaths);
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

    if (_.includes(SUPPORTED_LINK_TYPES, link.hrefType) === false) {
      this.push(chunk);
      return cb();
    }

    if (link.hrefType === 'string') {
      this.push(_.assign(chunk, { [options.output]: link.href }));
      return cb();
    }

    // Inflate local or remote file streams
    const inflater = inflateDuplex(chunk, link);
    if (link.hrefType === 'file') input = fs.createReadStream(link.href, { encoding: 'utf8' });
    if (link.hrefType === 'http') input = request.get(link.href);

    input
      .on('error', (err) => {
        this.push(chunk);
        this.emit('error', _.merge(err, { msg: 'Could not read file' }));
        cb();
      })
      .on('response', (res) => {
        if (res.statusCode !== 200) {
          this.emit('error', { msg: res.statusMessage, path: link.href });
          cb();
        }
      });

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
