import { Readable } from 'stream';

export default function inflate() {
  const rs = new Readable({ objectMode: true });

  rs._read = function read() {
    this.push('Not implemented');
    this.push(null);
  };

  return rs;
}
