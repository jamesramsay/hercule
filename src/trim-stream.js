import through2 from 'through2';

/**
* Trims EOF new line
*
* Input stream: (string)
*
* Output stream: (string)
*/

module.exports = function TrimStream() {
  let inputBuffer = '';

  function transform(chunk, encoding, cb) {
    inputBuffer += chunk.toString('utf8');

    this.push(inputBuffer.slice(0, -1));
    inputBuffer = inputBuffer.slice(-1);

    cb();
  }


  function flush(cb) {
    // Empty internal buffer and signal the end of the output stream.
    if (inputBuffer !== '') {
      inputBuffer = inputBuffer.replace(/\n$/, '');
      this.push(inputBuffer);
    }

    this.push(null);
    cb();
  }

  return through2.obj(transform, flush);
};
