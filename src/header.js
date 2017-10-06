import through2 from 'through2';
import _ from 'lodash';

export default function Header() {
  const inputBuffer = [];

  function transform(chunk, encoding, cb) {
    if (chunk.content) inputBuffer.push(chunk);

    // The input buffer shouldn't have more than two items in it at a time
    while (inputBuffer.length > 1) {
      const header = inputBuffer[0].header;
      let content = inputBuffer[0].content;

      if (header) {
        content = _.replace(
          content,
          /^(#+)([^#|\n]*)/g,
          `$1${_.repeat('#', header)}$2`
        );
        inputBuffer[0].content = content;
      }
      this.push(inputBuffer.shift());
    }

    return cb();
  }

  function flush(cb) {
    // Empty internal buffer and signal the end of the output stream.
    if (inputBuffer.length > 0) this.push(inputBuffer.shift());
    this.push(null);
    return cb();
  }

  return through2.obj(transform, flush);
}
