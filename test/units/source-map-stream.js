import test from 'ava';
import SourceMapStream from '../../src/source-map-stream';


test.cb('should handle no input', (t) => {
  const testStream = new SourceMapStream();

  testStream.on('readable', function read() {
    if (this.read() !== null) t.fail();
  });

  testStream.on('end', () => {
    t.pass();
    t.end();
  });

  testStream.end();
});

test.cb('should not modify input', (t) => {
  const input = {
    content: 'The quick brown fox jumps over the lazy dog.',
    source: 'foo.md',
    line: 1,
    column: 0,
  };
  const testStream = new SourceMapStream();
  let output;

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output = chunk;
    }
  });

  testStream.on('end', () => {
    t.deepEqual(output, input);
    t.end();
  });

  testStream.write(input);
  testStream.end();
});

test.cb('should emit a sourcemap', (t) => {
  const input = {
    content: 'The quick brown fox jumps over the lazy dog.',
    source: 'foo.md',
    line: 1,
    column: 0,
  };
  const testStream = new SourceMapStream('output.md');

  testStream.on('readable', function read() {
    while (this.read() !== null) {
      // emtpy
    }
  });

  testStream.on('sourcemap', (sourcemap) => {
    t.deepEqual(sourcemap, {
      version: 3,
      sources: ['foo.md'],
      names: [],
      mappings: 'AAAA',
      file: '../output.md',
    });
    t.end();
  });

  testStream.write(input);
  testStream.end();
});
