import request from 'request';
import duplexer from 'duplexer2';
import TrimStream from '../trim-stream';

/**
 * inflate() returns a readable stream of the file excluding the terminating <newline> character of the last line.
 * This permits inline and in-paragraph transclusion as some aspects of markdown are sensitive to newlines.
 *
 * @param {string} link - HTTP path to the file to be transcluded
 * @return {Object} outputStream - Readable stream object
 */
export default function inflate(link) {
  const trimStream = new TrimStream();
  const remoteStream = request.get(link);

  // Manually trigger error since 2XX respsonse doesn't trigger error despite not having expected content
  remoteStream.on('response', function error(res) {
    if (res.statusCode !== 200) this.emit('error', { message: 'Could not read file', path: link });
  });

  remoteStream.pipe(trimStream);

  // duplexer bubbles errors automatically for convenience
  const outputStream = duplexer({ objectMode: true }, remoteStream, trimStream);

  return outputStream;
}
