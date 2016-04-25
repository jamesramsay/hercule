import fs from 'fs';

export default function inflate(link) {
  return fs.createReadStream(link, { encoding: 'utf8' });
}
