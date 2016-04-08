import test from 'ava';
import TrimStream from '../../lib/trim-stream';


test.cb('should handle no input', (t) => {
  const testStream = new TrimStream();

  testStream.on('readable', function read() {
    if (this.read() !== null) t.fail();
  });

  testStream.on('end', () => {
    t.pass();
    t.end();
  });

  testStream.end();
});


test.cb('should not modify input without trailing new line', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const testStream = new TrimStream();
  let output = '';

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output += chunk;
    }
  });

  testStream.on('end', () => {
    t.deepEqual(output, input);
    t.end();
  });

  testStream.write(input);
  testStream.end();
});


test.cb('should not modify input with internal new lines', (t) => {
  const input = 'The quick brown\nfox jumps\nover the lazy dog.';
  const testStream = new TrimStream();
  let output = '';

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output += chunk;
    }
  });

  testStream.on('end', () => {
    t.deepEqual(output, input);
    t.end();
  });

  testStream.write(input);
  testStream.end();
});


test.cb('should only trim trailing new line', (t) => {
  const input = 'The quick brown\nfox jumps\nover the lazy dog.\n\n';
  const expect = 'The quick brown\nfox jumps\nover the lazy dog.\n';
  const testStream = new TrimStream();
  let output = '';

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output += chunk;
    }
  });

  testStream.on('end', () => {
    t.deepEqual(output, expect);
    t.end();
  });

  testStream.write(input);
  testStream.end();
});
