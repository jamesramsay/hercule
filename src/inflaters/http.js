import request from 'request';

/**
 * inflate() returns a readable stream of the file excluding the terminating <newline> character of the last line.
 * This permits inline and in-paragraph transclusion as some aspects of markdown are sensitive to newlines.
 *
 * @param {string} link - HTTP path to the file to be transcluded
 * @return {Object} outputStream - Readable stream object
 */
export default function inflate(link) {
  const remoteStream = request.get(link);

  // Manually trigger error since 2XX respsonse doesn't trigger error despite not having expected content
  remoteStream.on('response', function error(res) {
    if (res.statusCode !== 200) this.emit('error', { message: 'Could not read file', path: link });
  });

  return remoteStream;
}
