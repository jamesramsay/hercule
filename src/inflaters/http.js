import request from 'request';
import duplexer from 'duplexer2';
import TrimStream from '../trim-stream';

/**
 * HTTP link inflater
 *
 * Simply returns readable stream of the HTTP link with trailing new line removed.
 * This allows inline transclusion by stripping traiing new line at EOF.
 */
export default function inflate(link) {
  const trimStream = new TrimStream();
  const remoteStream = request.get(link);

  remoteStream.on('response', function error(res) {
    if (res.statusCode !== 200) {
      this.emit('error', { message: 'Could not read file', path: link });
    }
  });

  remoteStream.pipe(trimStream);

  return duplexer({ objectMode: true }, remoteStream, trimStream);
}
