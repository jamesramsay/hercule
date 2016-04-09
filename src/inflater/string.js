import { Readable } from 'stream';

export default function inflate(content) {
  const stringStream = new Readable;
  stringStream.push(content);
  stringStream.push(null);
  return stringStream;
}
