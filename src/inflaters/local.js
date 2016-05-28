import fs from 'fs';
import duplexer from 'duplexer2';
import TrimStream from '../trim-stream';

/**
 * Local link inflater
 *
 * Simply returns readable stream of the file with trailing new line removed.
 * This allows inline transclusion by stripping traiing new line at EOF.
 */
export default function inflate(link) {
  const trimStream = new TrimStream();
  const localStream = fs.createReadStream(link, { encoding: 'utf8' });

  localStream.pipe(trimStream);

  return duplexer({ objectMode: true }, localStream, trimStream);
}
