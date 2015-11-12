import test  from 'ava';
import RegExStream from '../src/RegExStream';


test('should find handle empty buffer', (t) => {
  let input = '';

  let testStream = new RegExStream(/\w+/i);

  testStream.on('readable', function() {
    var content = null;
    while (content = this.read()) {
      t.fail();
    }
  });

  testStream.on('end', function() {
    t.pass();
    t.end();
  });

  testStream.write(input, 'utf8');
  testStream.end();

});

test('should return objects (transform)', (t) => {
  t.plan(18);
  let input = 'The quick brown fox jumps over the lazy dog.';
  let expected = [
    'The', ' ', 'quick', ' ', 'brown', ' ', 'fox', ' ', 'jumps', ' ', 'over', ' ', 'the', ' ', 'lazy', ' ', 'dog', '.'
  ];

  let testStream = new RegExStream(/\w+/i);

  testStream.on('readable', function() {
    var content = null;
    while (content = this.read()) {
      t.same(content, expected[0]);
      expected = expected.slice(1);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  input.match(/.{1,3}/gi)
    .forEach(function(chunk) {
        testStream.write(chunk, 'utf8');
    });

  testStream.end();
});

test('should return objects (flush)', (t) => {
  t.plan(2);
  let input = 'a(test)';
  let expected = [
    'a', '(test)'
  ];

  let testStream = new RegExStream(/\(\w+\)/i);

  testStream.on('readable', function() {
    var content = null;
    while (content = this.read()) {
      t.same(content, expected[0]);
      expected = expected.slice(1);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  input.match(/.{1,3}/gi)
    .forEach(function(chunk) {
        testStream.write(chunk, 'utf8');
    });

  testStream.end();
});
