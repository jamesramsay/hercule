import through2 from 'through2';
import fs from 'fs';
import _ from 'lodash';
import request from 'request';

import RegexStream from '../lib/regex-stream';
import PegStream from './peg-stream';
import ResolveStream from './resolve-stream';
import TrimStream from './trim-stream';
import {grammar, linkRegExp, LINK_GROUP} from './config';

/**
* Input stream: object
* - link (object, required)
*   - href (string, required)
*   - hrefType (enum, required)
*
* Output stream: object
* - chunk (string, required)
*
* Input and output properties can be altered by providing options
*/

const defaultOptions = {
  input: 'link',
  output: 'chunk',
};

module.exports = function InflateStream(options) {
  const opt = _.merge({}, defaultOptions, options);

  function inflateString(chunk, link, cb) {
    this.push(_.assign({}, chunk, {[opt.output]: link.href}));
    return cb();
  }

  function inflateLocalFile(chunk, link, cb) {
    const input = fs.createReadStream(link.href, {encoding: 'utf8'});
    const self = this;
    const tokenizer = new RegexStream(linkRegExp, {
      match: 'link',
      extend: {
        relativePath: chunk.relativePath,
        parents: _.merge([], chunk.parents),
        parentRefs: _.merge([], chunk.parentRefs),
      },
    });
    const parser = new PegStream(grammar, {
      expression: `link[${LINK_GROUP}]`,
      parsed: 'link',
    });
    const resolver = new ResolveStream();
    const inflater = new InflateStream();
    const trimmer = new TrimStream();

    let content;

    input.on('error', function inputError(err) {
      if (err.code === 'ENOENT') {
        // console.log(`Error: Local file (${link.href}) not found.`);
        self.push(chunk);
      } else {
        // console.log(`Error: Local file (${link.href}) could not be transcluded.`);
      }
      return cb();
    });

    inflater.on('readable', function inputReadable() {
      while ((content = this.read()) !== null) {
        self.push(content);
      }
    });

    inflater.on('end', function inputEnded() {
      return cb();
    });

    input
    .pipe(trimmer)
    .pipe(tokenizer)
    .pipe(parser)
    .pipe(resolver)
    .pipe(inflater);
  }

  function inflateRemoteFile(chunk, link, cb) {
    request(link.href, (err, res, content) => {
      let output;
      if (err || res.statusCode !== 200) {
        // console.log(`Warning: Remote file (${link.href}) could not be retrieved.`);
        this.push(chunk);
        return cb();
      }

      output = content.replace(/\n$/, '');

      this.push(_.assign({}, chunk, {[opt.output]: output}));
      return cb();
    });
  }

  function transform(chunk, encoding, cb) {
    const link = chunk[opt.input];

    if (!link) {
      this.push(chunk);
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
