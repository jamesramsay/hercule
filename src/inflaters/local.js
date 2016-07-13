import fs from 'fs';
import duplexer from 'duplexer2';
import TrimStream from '../trim-stream';

/**
 * inflate() returns a readable stream of the file excluding the terminating <newline> character of the last line.
 * This permits inline and in-paragraph transclusion as some aspects of markdown are sensitive to newlines.
 *
 * @param {string} link - Absolute path to the file to be transcluded
 * @return {object} outputStream - Readable stream object
 */
export default function inflate(link) {
  const trimStream = new TrimStream();
  const localStream = fs.createReadStream(link, { encoding: 'utf8' });

  localStream.pipe(trimStream);

  // duplexer bubbles errors automatically for convenience
  const outputStream = duplexer({ objectMode: true }, localStream, trimStream);

  return outputStream;
}
