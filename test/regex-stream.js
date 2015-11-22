import test  from 'ava';
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
  t.plan(18);
  let input = 'The quick brown fox jumps over the lazy dog.';
  let expected = [
    {content: 'The',   tokenType: 'match'},
    {content: ' ',     tokenType: 'miss'},
    {content: 'quick', tokenType: 'match'},
    {content: ' ',     tokenType: 'miss'},
    {content: 'brown', tokenType: 'match'},
    {content: ' ',     tokenType: 'miss'},
    {content: 'fox',   tokenType: 'match'},
    {content: ' ',     tokenType: 'miss'},
    {content: 'jumps', tokenType: 'match'},
    {content: ' ',     tokenType: 'miss'},
    {content: 'over',  tokenType: 'match'},
    {content: ' ',     tokenType: 'miss'},
    {content: 'the',   tokenType: 'match'},
    {content: ' ',     tokenType: 'miss'},
    {content: 'lazy',  tokenType: 'match'},
    {content: ' ',     tokenType: 'miss'},
    {content: 'dog',   tokenType: 'match'},
    {content: '.',     tokenType: 'miss'}
  ];

  let testStream = new RegexStream(/\w+/i);

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
    {content: 'a', tokenType: 'miss'},
    {content: '(test)', tokenType: 'match'}
  ];

  let testStream = new RegexStream(/\(\w+\)/g);

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
