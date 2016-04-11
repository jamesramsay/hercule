import path from 'path';
import _ from 'lodash';
import through2 from 'through2';
import duplexer from 'duplexer2';
import regexpTokenizer from 'regexp-stream-tokenizer';

import ResolveStream from './resolve-stream';
import TrimStream from './trim-stream';

import localInflater from './inflaters/local';
import httpInflater from './inflaters/http';

import { defaultTokenRegExp, defaultToken, defaultSeparator, WHITESPACE_GROUP, LINK_TYPES } from './config';

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


export default function InflateStream(opt) {
  const options = _.merge({}, opt);

  function inflateDuplex(chunk, source) {
    const resolver = new ResolveStream();
    const inflater = new InflateStream();
    const trimmer = new TrimStream();

    function token(match) {
      return _.merge(
        defaultToken(match, options, chunk.indent),
        {
          relativePath: path.dirname(source),
          references: [...chunk.references],
          parents: [source, ...chunk.parents],
        }
      );
    }

    function separator(match) {
      return _.merge(
        defaultSeparator(match),
        {
          indent: chunk.indent,
        }
      );
    }

    const tokenizerOptions = { leaveBehind: `${WHITESPACE_GROUP}`, source, token, separator };
    const linkRegExp = _.get(options, 'linkRegExp') || defaultTokenRegExp;
    const tokenizer = regexpTokenizer(tokenizerOptions, linkRegExp);

    trimmer.pipe(tokenizer).pipe(resolver).pipe(inflater);

    return duplexer({ objectMode: true }, trimmer, inflater);
  }

  function isSupportedLink(linkPath, linkType) {
    return !(_.isUndefined(linkPath)) && _.includes(_.values(LINK_TYPES), linkType);
  }

  // eslint-disable-next-line consistent-return
  function transform(chunk, encoding, cb) {
    const linkPath = _.get(chunk, 'link.href');
    const linkType = _.get(chunk, 'link.hrefType');
    const parents = _.get(chunk, 'parents');
    const self = this;
    let input;

    if (!isSupportedLink(linkPath, linkType)) {
      this.push(chunk);
      return cb();
    }

    if (parents && _.includes(parents, linkPath)) {
      this.push(chunk);
      this.emit('error', {
        msg: 'Circular dependency detected',
        path: linkPath,
      });
      return cb();
    }

    if (linkType === LINK_TYPES.STRING) input = linkPath;
    if (linkType === LINK_TYPES.LOCAL) input = localInflater.call(this, linkPath, chunk, cb);
    if (linkType === LINK_TYPES.HTTP) input = httpInflater.call(this, linkPath, chunk, cb);

    if (_.isString(input)) {
      this.push(_.assign(chunk, { content: input }));
      return cb();
    }

    // Inflate local or remote file streams
    const inflater = inflateDuplex(chunk, linkPath);

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
