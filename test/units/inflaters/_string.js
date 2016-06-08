import test from 'ava';
import stringInflater from '../../../src/inflaters/string';

test.cb('should return exactly one object', (t) => {
  const content = 'Quick brown fox';
  const source = 'animal.md';
  const testStream = stringInflater(content, source);

  t.plan(1);

  testStream.on('readable', function read() {
    t.deepEqual(this.read(), { content, source });
  });

  testStream.on('end', () => t.end());
});
