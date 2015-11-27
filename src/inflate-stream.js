import through2 from 'through2';
import fs from 'fs';
import _ from 'lodash';
import request from 'request';

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

  function inflateString(chunk, link, cb) {
    chunk[opt.output] = link.href;
    this.push(chunk);
    return cb();
  }

  function inflateLocalFile(chunk, link, cb) {
    let content;

    try {
      content = fs.readFileSync(link.href, 'utf8').replace(/\n$/, '');
      chunk[opt.output] = content;
    } catch (err) {
      console.log(`Warning: Local file (${link.href}) not found.`);
    }

    this.push(chunk);
    return cb();
  }

  function inflateRemoteFile(chunk, link, cb) {
    request(link.href, (err, res, content) => {
      if (err || res.statusCode !== 200) {
        console.log(`Warning: Remote file (${link.href}) could not be retrieved.`);
        this.push(chunk);
        return cb();
      }

      chunk[opt.output] = content.replace(/\n$/, '');
      this.push(chunk);
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
