import request from 'request';

export default function inflate(link, chunk, cb) {
  return request.get(link)
    .on('response', (res) => {
      if (res.statusCode !== 200) {
        this.emit('error', { msg: res.statusMessage, path: link });
        cb();
      }
    });
}
