import through2 from 'through2';

/**
* Indents each line of a chunk by the provided indent amount
*/

export default function IndentStream() {
  const NEWLINE = '\n';
  const inputBuffer = [];

  function transform(chunk, encoding, cb) {
    inputBuffer.push(chunk);

    // The input buffer shouldn't have more than two items in it at a time
    while (inputBuffer.length > 1) {
      const indent = inputBuffer[0].indent;
      let content = inputBuffer[0].content;
      const endsWithNewLine = inputBuffer[0].content.slice(-1) === NEWLINE;
      const followedByNewLine = inputBuffer[1].content.slice(0, 1) === NEWLINE;

      if (indent) {
        content = content.replace(/\n(?!\s)/g, `\n${indent}`);

        if (endsWithNewLine && followedByNewLine) {
          content = content.replace(/\n\s+$/g, NEWLINE);
        }

        inputBuffer[0].content = content;
      }

      const out = inputBuffer.shift();
      this.push(out);
    }

    return cb();
  }

  function flush(cb) {
    // Empty internal buffer and signal the end of the output stream.
    if (inputBuffer.length > 0) {
      const indent = inputBuffer[0].indent;
      const content = inputBuffer[0].content;
      if (indent) inputBuffer[0].content = content.replace(/\n(?!\s|$)/g, `\n${indent}`);
      this.push(inputBuffer.shift());
    }
    this.push(null);
    return cb();
  }

  return through2.obj(transform, flush);
}
