import test  from 'ava';
import PegStream from '../lib/peg-stream';
import grammar from '../lib/transclude-parser';


test('should handle no input', (t) => {

  let testStream = new PegStream(grammar);

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.fail();
    }
  });

  testStream.on('end', function() {
    t.pass();
    t.end();
  });

  testStream.end();

});


test('should skip input without expression', (t) => {
  let input = {
    chunk: 'The quick brown fox jumps over the lazy dog./n'
  }

  let testStream = new PegStream(grammar);

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.notOk(chunk.parsed);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});


test('should parse input with expression', (t) => {
  let input = {
    chunk: 'The quick brown :[](animal.md) jumps over the lazy dog./n',
    expression: 'animal.md'
  }

  let options = {
    expression: 'expression',
    parsed: 'parsed'
  }

  let testStream = new PegStream(grammar, options);

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.ok(chunk.parsed);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});
