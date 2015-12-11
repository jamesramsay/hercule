import through2 from 'through2';
import fs from 'fs';
import _ from 'lodash';
import request from 'request';

import RegexStream from '../lib/regex-stream';
import ResolveStream from './resolve-stream';
import TrimStream from './trim-stream';
import {grammar, linkRegExp, getLink, WHITESPACE_GROUP} from './config';

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

const defaultOptions = {
  input: 'link',
  output: 'content',
};

module.exports = function InflateStream(options) {
  const opt = _.merge({}, defaultOptions, options);


  function inflateString(chunk, link, cb) {
    const output = _.assign({}, chunk, {[opt.output]: link.href});
    this.push(output);
    return cb();
  }


  function inflateLocalFile(chunk, link, cb) {
    const input = fs.createReadStream(link.href, {encoding: 'utf8'});
    const indent = chunk.indent;
    const resolver = new ResolveStream(grammar);
    const inflater = new InflateStream();
    const trimmer = new TrimStream();
    const tokenizer = new RegexStream(linkRegExp, {
      match: {
        link: getLink,
        indent: (match) => {return '' + indent + match[WHITESPACE_GROUP];},
      },
      leaveBehind: `${WHITESPACE_GROUP}`, // TODO: add failing test for this missing
      extend: {
        relativePath: chunk.relativePath,
        parents: [link.href, ...chunk.parents],
        references: [...chunk.references],
        indent,
      },
    });

    const self = this;

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
      const error = {
        message: `${link.href} could not be be read.`,
        code: err.code,
      };
      self.push(_.assign(chunk, error));
      return cb();
    });

    input.pipe(trimmer).pipe(tokenizer).pipe(resolver).pipe(inflater);
  }


  function inflateRemoteFile(chunk, link, cb) {
    request(link.href, (err, res, content) => {
      let output;

      if (err || res.statusCode !== 200) {
        const error = {
          message: `${link.href} could not be retrieved.`,
          code: (err || res.statusCode),
        };
        this.push(_.assign(chunk, error));
        return cb();
      }

      output = {
        [opt.output]: content.replace(/\n$/, ''),
      };

      this.push(_.assign({}, chunk, output));
      return cb();
    });
  }


  function transform(chunk, encoding, cb) {
    const link = chunk[opt.input];
    const parents = chunk.parents;

    if (!link) {
      this.push(chunk);
      return cb();
    }

    if (_(parents).contains(link.href)) {
      const error = {
        message: `${link.href} skipped to prevent circular transclusion.`,
      };
      this.push(_.assign(chunk, error));
      return cb();
    }

    switch (link.hrefType) {
    case 'file':
      inflateLocalFile.call(this, chunk, link, cb);
      break;
    case 'http':
      inflateRemoteFile.call(this, chunk, link, cb);
      break;
    case 'string':
      inflateString.call(this, chunk, link, cb);
      break;
    default:
      this.push(chunk);
      return cb();
    }
  }

  return through2.obj(transform);
};
