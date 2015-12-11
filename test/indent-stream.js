import test from 'ava';
import IndentStream from '../lib/indent-stream';


test.cb('should handle no input', (t) => {
  const testStream = new IndentStream();

  testStream.on('readable', function read() {
    if (this.read() !== null) t.fail();
  });

  testStream.on('end', function end() {
    t.pass();
    t.end();
  });

  testStream.end();
});


test.cb('should not modify input without whitespace', (t) => {
  const input = {
    content: 'The quick brown fox jumps over the lazy dog.',
    whitespace: null,
  };
  const testStream = new IndentStream();

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.same(chunk, input);
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  testStream.write(input);
  testStream.end();
});


test.cb('should not modify input without new lines', (t) => {
  const input = {
    content: 'The quick brown fox jumps over the lazy dog.',
    whitespace: '  ',
  };
  const testStream = new IndentStream();

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.same(chunk, input);
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  testStream.write(input);
  testStream.end();
});


test.cb('should only indent text after each new line', (t) => {
  const input = {
    content: 'The quick brown\nfox jumps\nover the lazy dog.\n',
    indent: '  ',
  };
  const expect = {
    content: 'The quick brown\n  fox jumps\n  over the lazy dog.\n  ',
    indent: '  ',
  };
  const testStream = new IndentStream();

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.same(chunk, expect);
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  testStream.write(input);
  testStream.end();
});
