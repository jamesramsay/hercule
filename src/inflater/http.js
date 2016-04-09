import request from 'request';

export default function inflate(link) {
  return request
    .get(link)
    .on('response', function error(res) {
      if (res.statusCode !== 200) {
        this.emit('error', { message: 'Could not read file', path: link });
      }
    });
}
