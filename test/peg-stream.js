import test from 'ava';
import PegStream from '../lib/peg-stream';
import grammar from '../lib/transclude-parser';


test.cb('should handle no input', (t) => {
  const testStream = new PegStream(grammar);

  testStream.on('readable', function read() {
    if (this.read() !== null) t.fail();
  });

  testStream.on('end', function end() {
    t.pass();
    t.end();
  });

  testStream.end();
});


test.cb('should skip input without expression', (t) => {
  const input = {
    chunk: 'The quick brown fox jumps over the lazy dog./n',
  };
  const testStream = new PegStream(grammar);

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.notOk(chunk.parsed);
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input with expression', (t) => {
  const input = {
    chunk: 'The quick brown :[](animal.md) jumps over the lazy dog./n',
    expression: 'animal.md',
  };
  const options = {
    expression: 'expression',
    parsed: 'parsed',
  };
  const testStream = new PegStream(grammar, options);

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.ok(chunk.parsed);
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  testStream.write(input);
  testStream.end();
});


test.cb('should handle parse error', (t) => {
  const input = {
    chunk: 'The quick brown :[](animal.md foo:bar:"exception!") jumps over the lazy dog./n',
    link: 'animal.md foo:bar:"exception!"',
  };
  const testStream = new PegStream(grammar);

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.ok(chunk.link);
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  testStream.write(input);
  testStream.end();
});
