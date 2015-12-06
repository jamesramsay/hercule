import through2 from 'through2';
import _ from 'lodash';

/**
* Indents each line of a chunk
*
* Input stream: (object)
*
* Output stream: (object)
*/

const defaultOptions = {
  input: 'chunk',
  output: 'chunk',
  indent: 'indent',
};

module.exports = function IndentStream(options) {
  const opt = _.merge({}, defaultOptions, options);

  function transform(chunk, encoding, callback) {
    const indent = _.get(chunk, opt.indent);

    if (!indent) {
      this.push(chunk);
      return callback();
    }

    chunk[opt.output] = chunk[opt.input].replace(/\n/g, `\n${indent}`);

    this.push(chunk);
    return callback();
  }

  return through2.obj(transform);
};
