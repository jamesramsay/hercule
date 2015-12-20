import through2 from 'through2';
import fs from 'fs';
import _ from 'lodash';
import request from 'request';

import RegexStream from '../lib/regex-stream';
import ResolveStream from './resolve-stream';
import TrimStream from './trim-stream';
import grammar from './transclude-parser';
import {DEFAULT_LOG, getLink, nestIndent, LINK_REGEXP, WHITESPACE_GROUP} from './config';

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

export default function InflateStream(options, log = DEFAULT_LOG) {
  const opt = _.merge({}, DEFAULT_OPTIONS, options);


  function inflateString(chunk, link, cb) {
    const output = _.assign({}, chunk, {[opt.output]: link.href});
    this.push(output);
    return cb();
  }


  function inflateLocalFile(chunk, link, cb) {
    const input = fs.createReadStream(link.href, {encoding: 'utf8'});
    const indent = chunk.indent;
    const resolver = new ResolveStream(grammar, null, log);
    const inflater = new InflateStream(null, log);
    const trimmer = new TrimStream();
    const tokenizer = new RegexStream(LINK_REGEXP, {
      match: {
        link: getLink,
        indent: nestIndent,
      },
      leaveBehind: `${WHITESPACE_GROUP}`,
      extend: {
        relativePath: chunk.relativePath,
        parents: [link.href, ...chunk.parents],
        references: [...chunk.references],
        indent: indent,
      },
    }, log);

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
      log.warn({err, link}, 'Could not read local file');
      self.push(chunk);
      return cb();
    });

    input.pipe(trimmer).pipe(tokenizer).pipe(resolver).pipe(inflater);
  }


  function inflateRemoteFile(chunk, link, cb) {
    request(link.href, (err, res, content) => {
      let output;

      if (err) {
        log.warn({err, link}, 'Could not read remote file');
        this.push(chunk);
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
      log.warn({link}, 'Circular dependency detected');
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
}
