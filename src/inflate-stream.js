import fs from 'fs';
import _ from 'lodash';
import through2 from 'through2';
import duplexer from 'duplexer2';
import request from 'request';

import RegexStream from '../lib/regex-stream';
import ResolveStream from './resolve-stream';
import TrimStream from './trim-stream';
import grammar from './transclude-parser';
import {DEFAULT_LOG, LINK_REGEXP, LINK_MATCH, WHITESPACE_GROUP} from './config';

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


  function inflateDuplex(chunk, link) {
    const indent = chunk.indent;
    const resolver = new ResolveStream(grammar, null, log);
    const inflater = new InflateStream(null, log);
    const trimmer = new TrimStream();
    const tokenizerOptions = {
      match: LINK_MATCH,
      leaveBehind: `${WHITESPACE_GROUP}`,
      extend: {
        relativePath: chunk.relativePath,
        parents: [link.href, ...chunk.parents],
        references: [...chunk.references],
        indent: indent,
      },
    };
    const tokenizer = new RegexStream(LINK_REGEXP, tokenizerOptions, log);

    trimmer.pipe(tokenizer).pipe(resolver).pipe(inflater);

    return duplexer({objectMode: true}, trimmer, inflater);
  }


  function transform(chunk, encoding, cb) {
    const link = chunk[opt.input];
    const parents = chunk.parents;
    const self = this;
    let input;
    let inflater;

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
    case 'string':
      this.push(_.assign({}, chunk, {[opt.output]: link.href}));
      return cb();
    case 'file':
      input = fs.createReadStream(link.href, {encoding: 'utf8'});
      break;
    case 'http':
      input = request.get(link.href);
      break;
    default:
      // Skip if unrecognised link type
      this.push(chunk);
      return cb();
    }

    inflater = inflateDuplex(chunk, link);
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
      log.warn({err, link}, 'Could not read file');
      self.push(chunk);
      return cb();
    });

    input.pipe(inflater);
  }

  return through2.obj(transform);
}
