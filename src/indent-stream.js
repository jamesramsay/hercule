import through2 from 'through2';
import _ from 'lodash';

/**
* Indents each line of a chunk by the provided indent amount
*
* Input stream: (object)
* - content (string, required)
* - indent (string, optional) - String to be appended to the start of each line.
*
* Output stream: (object)
* - content (string)
*/

const defaultOptions = {
  input: 'content',
  output: 'content',
  indent: 'indent',
};

module.exports = function IndentStream(options) {
  const opt = _.merge({}, defaultOptions, options);

  function transform(chunk, encoding, callback) {
    const indent = _.get(chunk, opt.indent);
    let content = _.get(chunk, opt.input);
    let output;

    if (!indent) {
      this.push(chunk);
      return callback();
    }

    content = content.replace(/\n/g, `\n${indent}`);
    output = _.assign(chunk, {[opt.output]: content});

    this.push(output);
    return callback();
  }

  return through2.obj(transform);
};
