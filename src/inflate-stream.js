import through2 from 'through2';
import fs from 'fs';
import _ from 'lodash';
// import request from 'request';

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

module.exports = function inflateStream(options) {
  const opt = _.merge({}, defaultOptions, options);

  function transform(chunk, encoding, cb) {
    const link = chunk[opt.input];
    let content;

    if (!link) {
      this.push(chunk);
      return cb();
    }

    switch (link.hrefType) {
    case 'file':
      try {
        content = fs.readFileSync(link.href, 'utf8').replace(/\n$/, '');
      } catch (err) {
        console.error(`Error: File (${link.href}) not found.`);
        content = null;
      }
      break;
    case 'string':
      content = link.href;
      break;
    default:
      content = '';
    }

    if (content !== null) {
      chunk[opt.output] = content;
    }

    this.push(chunk);
    return cb();
  }

  return through2.obj(transform);
};
