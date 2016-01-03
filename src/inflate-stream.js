import fs from 'fs';
import _ from 'lodash';
import through2 from 'through2';
import duplexer from 'duplexer2';
import request from 'request';
import regexpTokenizer from 'regexp-stream-tokenizer';

import ResolveStream from './resolve-stream';
import TrimStream from './trim-stream';
import grammar from './transclude-parser';
import { DEFAULT_LOG, LINK_REGEXP, LINK_GROUP, WHITESPACE_GROUP, SUPPORTED_LINK_TYPES } from './config';

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

export default function InflateStream(opt, log = DEFAULT_LOG) {
  const options = _.merge({}, DEFAULT_OPTIONS, opt);

  function inflateDuplex(chunk, link) {
    const resolver = new ResolveStream(grammar, null, log);
    const inflater = new InflateStream(null, log);
    const trimmer = new TrimStream();
    const tokenizerOptions = {
      leaveBehind: `${WHITESPACE_GROUP}`,
      token: (match) => {
        return {
          content: _.get(match, `[0]`),
          link: {
            href: _.get(match, `[${LINK_GROUP}]`),
          },
          indent: _([chunk.indent, match[WHITESPACE_GROUP]]).filter(_.isString).value().join(''),
          relativePath: chunk.relativePath,
          parents: [link.href, ...chunk.parents],
          references: [...chunk.references],
        };
      },
      separator: (separator) => {
        return {
          content: separator,
          indent: chunk.indent,
        };
      },
    };
    const tokenizer = regexpTokenizer(tokenizerOptions, LINK_REGEXP);

    trimmer.pipe(tokenizer).pipe(resolver).pipe(inflater);

    return duplexer({ objectMode: true }, trimmer, inflater);
  }


  function transform(chunk, encoding, cb) {
    const link = chunk[options.input];
    const parents = chunk.parents;
    const self = this;
    let input;
    let inflater;

    if (!link) {
      this.push(chunk);
      return cb();
    }

    // ES2016: Array.includes()
    if (_(parents).includes(link.href)) {
      log.error({ link }, 'Circular dependency detected');
      this.push(chunk);
      return cb();
    }

    if (_(SUPPORTED_LINK_TYPES).includes(link.hrefType) === false) {
      this.push(chunk);
      return cb();
    }

    if (link.hrefType === 'string') {
      this.push(_.assign(chunk, { [options.output]: link.href }));
      return cb();
    }

    // Inflate local or remote file streams
    inflater = inflateDuplex(chunk, link);
    if (link.hrefType === 'file') input = fs.createReadStream(link.href, { encoding: 'utf8' });
    if (link.hrefType === 'http') input = request.get(link.href);

    inflater.on('readable', function inputReadable() {
      let content;
      while ((content = this.read()) !== null) {
        self.push(content);
      }
    });

    inflater.on('end', function inputEnded() {
      return cb();
    });

    input.on('error', function inputError(err) {
      log.error({ err, link }, 'Could not read file');
      self.push(chunk);
      return cb();
    });

    input.pipe(inflater);
  }

  return through2.obj(transform);
}
