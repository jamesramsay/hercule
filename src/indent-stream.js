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

const DEFAULT_OPTIONS = {
  input: 'content',
  output: 'content',
  indent: 'indent',
};

export default function IndentStream(opt) {
  const options = _.merge({}, DEFAULT_OPTIONS, opt);

  function transform(chunk, encoding, cb) {
    const indent = _.get(chunk, options.indent);
    let content = _.get(chunk, options.input);
    let output;

    if (!indent) {
      this.push(chunk);
      return cb();
    }

    content = content.replace(/\n/g, `\n${indent}`);
    output = _.assign(chunk, { [options.output]: content });

    this.push(output);
    return cb();
  }

  return through2.obj(transform);
}
