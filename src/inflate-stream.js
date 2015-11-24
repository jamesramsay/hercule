import through2 from 'through2';
import fs from 'fs';
import _ from 'lodash';

/*

Input stream: Object
- link (object, required)
  - href (string, required)
  - hrefType (enum, required)

Output stream: Object
- chunk (string, required)

Input and output properties can be altered by providing options

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
      content = fs.readFileSync(link.href, 'utf8').replace(/\n$/, '');
      break;
    case 'string':
      content = link.href;
      break;
    default:
      content = '';
    }

    chunk[opt.output] = content;
    this.push(chunk);
    return cb();
  }

  return through2.obj(transform);
};
