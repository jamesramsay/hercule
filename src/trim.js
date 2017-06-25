import _ from 'lodash';
import through2 from 'through2';

export default function Trim() {
  const NEWLINE = '\n';
  const inputBuffer = [];
  let memoContent = null;
  let memoSource = null;

  function transform(chunk, encoding, cb) {
    if (chunk.content === '') return cb();

    inputBuffer.push(chunk);

    while (inputBuffer.length > 1) {
      const nextFileIsAncestor =
        inputBuffer[1].parents &&
        _.includes(inputBuffer[0].parents, inputBuffer[1].source);
      const isFileEdge =
        inputBuffer[0].source !== inputBuffer[1].source &&
        memoSource !== inputBuffer[1].source;

      // EOF edge verify file is ending checking it isn't a parent of the next file
      if (isFileEdge && nextFileIsAncestor) {
        if (
          (inputBuffer[0].content.slice(-1) === NEWLINE ||
            memoContent === NEWLINE) &&
          inputBuffer[1].content.slice(0, 1) === NEWLINE
        ) {
          // Scenario A: transclusion at end of line since both characters are a new line
          //    remove new line from next file
          //    Edge: still be inline, can't yet push
          inputBuffer[1].content = inputBuffer[1].content.slice(1);
          memoContent = NEWLINE;
          memoSource = inputBuffer[1].source;

          if (inputBuffer[1].content === '') {
            // The token was only one character long.
            // The removed new line could either be EOF or mid-file
            inputBuffer.pop();
          }
        } else if (
          (inputBuffer[0].content.slice(-1) === NEWLINE ||
            memoContent === NEWLINE) &&
          inputBuffer[1].content.slice(0, 1) !== NEWLINE
        ) {
          // Scenario B: inline transclusion since next character is not a new line
          //   remove new line from end of file
          inputBuffer[0].content = inputBuffer[0].content.slice(0, -1);
          memoContent = null;
          memoSource = null;
        }
      } else {
        memoContent = null;
        memoSource = null;
      }

      if (inputBuffer.length > 1) {
        const out = inputBuffer.shift();
        this.push(out);
      }
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
