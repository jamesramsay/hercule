import through2 from 'through2';
import _ from 'lodash';

/**
* Trims new line at EOF to allow a file to be transcluded inline.
* Multiple transclusions immediately before the end of file can also
* result excessive new lines accumulating.
*
* Input stream: (string)
*
* Output stream: (string)
*/

export default function TrimStream() {
  let inputBuffer = '';

  function transform(chunk, encoding, cb) {
    // Allow objects to be passed through unaltered
    if (!_.isString(chunk) && !_.isBuffer(chunk)) {
      return cb(null, chunk);
    }

    const input = chunk.toString('utf8');

    // Combine buffer and new input
    inputBuffer = inputBuffer.concat(input);

    // Return everything but the last character
    const output = inputBuffer.slice(0, -1); // eslint-disable-line lodash/prefer-lodash-method
    inputBuffer = inputBuffer.slice(-1); // eslint-disable-line lodash/prefer-lodash-method

    this.push(output);
    return cb();
  }


  function flush(cb) {
    // Empty internal buffer and signal the end of the output stream.
    if (inputBuffer !== '') {
      inputBuffer = inputBuffer.replace(/\n$/, '');
      this.push(inputBuffer);
    }

    this.push(null);
    return cb();
  }

  return through2.obj(transform, flush);
}
