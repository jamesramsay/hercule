import test from 'ava';
import stringInflater from '../../../src/inflaters/string';

test.cb('should return exactly one object', (t) => {
  const content = '"Quick brown fox"';
  const source = 'animal.md';
  const line = 1;
  const column = 0;
  const testStream = stringInflater(content, source, line, column);

  t.plan(1);

  testStream.on('readable', () => {
    let chunk;
    while ((chunk = testStream.read()) !== null) {
      t.deepEqual(chunk, { content: 'Quick brown fox', source, line, column: 1 });
    }
  });

  testStream.on('end', () => t.end());
});
