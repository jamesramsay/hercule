import test from 'ava';
import RegexStream from '../src/regex-stream';


test('should find handle empty buffer', (t) => {
  let input = '';

  let testStream = new RegexStream(/\w+/i);

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
  let input = 'The quick brown fox jumps over the lazy dog.';
  let expected = [
    {chunk: 'The',   match: true},
    {chunk: ' '},
    {chunk: 'quick', match: true},
    {chunk: ' '},
    {chunk: 'brown', match: true},
    {chunk: ' '},
    {chunk: 'fox',   match: true},
    {chunk: ' '},
    {chunk: 'jumps', match: true},
    {chunk: ' '},
    {chunk: 'over',  match: true},
    {chunk: ' '},
    {chunk: 'the',   match: true},
    {chunk: ' '},
    {chunk: 'lazy',  match: true},
    {chunk: ' '},
    {chunk: 'dog',   match: true},
    {chunk: '.'}
  ];

  let testStream = new RegexStream(/\w+/i);

  testStream.on('readable', function() {
    var content = null;
    while (content = this.read()) {
      t.same(content.chunk, expected[0].chunk);
      if (expected[0].match) {
        t.ok(content.match);
      } else {
        t.notOk(content.match);
      }
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
  let input = 'a (fox) a (dog) a (cat)';
  let expected = [
    {chunk: 'a '},
    {chunk: '(fox)', match: true},
    {chunk: ' a '},
    {chunk: '(dog)', match: true},
    {chunk: ' a '},
    {chunk: '(cat)', match: true}
  ];

  let testStream = new RegexStream(/\(\w+\)/g);

  testStream.on('readable', function() {
    var content = null;
    while (content = this.read()) {
      t.same(content.chunk, expected[0].chunk);
      if (expected[0].match) {
        t.ok(content.match);
      } else {
        t.notOk(content.match);
      }
      expected = expected.slice(1);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  input.match(/.{1,14}/gi)
    .forEach(function(chunk) {
        testStream.write(chunk, 'utf8');
    });

  testStream.end();
});
