import test from 'ava';

import Transcluder from '../../lib/transclude-stream';

test.cb('should handle no input', (t) => {
  const testStream = new Transcluder();

  testStream.on('readable', function read() {
    if (this.read() !== null) t.fail();
  });

  testStream.on('end', () => {
    t.pass();
    t.end();
  });

  testStream.end();
});

test.cb('should return input without link unmodified', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog./n';
  const testStream = new Transcluder();
  let output = '';

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        output += chunk;
      }
    })
    .on('error', () => t.fail())
    .on('end', () => {
      t.deepEqual(input, output);
      t.end();
    });

  testStream.write(input);
  testStream.end();
});

test.cb('should emit error and end on syntax error', (t) => {
  const input = 'The quick brown :[](animal.md foo:bar:"exception!") jumps over the lazy dog.';
  const testStream = new Transcluder();

  t.plan(1);
  testStream
    .on('readable', function read() {
      this.read();
    })
    .on('error', () => t.pass())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});
