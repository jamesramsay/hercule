import fs from 'fs';
import _ from 'lodash';

export default function inflate(link, chunk, cb) {
  return fs.createReadStream(link, { encoding: 'utf8' })
    .on('error', (err) => {
      this.push(chunk);
      this.emit('error', _.merge(err, { msg: 'Could not read file' }));
      cb();
    });
}
