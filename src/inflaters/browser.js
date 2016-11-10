import { Readable } from 'stream';

export default function inflate() {
  const browserStream = new Readable();

  browserStream.emit('error', new Error('Please provide a custom linkResolver for use in browser.'));
  browserStream.push(null);
  return browserStream;
}
