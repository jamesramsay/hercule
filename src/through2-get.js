import through2 from 'through2';
import _ from 'lodash';

/**
* Streaming version of lodash 'get' function
*/

export default function through2Get(propPath) {

  function transform(chunk, encoding, cb) {
    const content = _.get(chunk, propPath);
    // Prevent signaling end of readable stream
    // https://nodejs.org/api/stream.html#stream_stream_push
    if (_.isString(content) && content !== '') {
      this.push(content);
    }

    return cb();
  }

  return through2.obj(transform);
}
