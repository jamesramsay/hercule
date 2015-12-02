import test from 'ava';
import {linkRegExp} from '../lib/config';
import RegexStream from '../lib/regex-stream';


test.cb('should find handle empty buffer', (t) => {
  const input = '';
  const testStream = new RegexStream(/\w+/);

  testStream.on('readable', function read() {
    if (this.read() !== null) t.fail();
  });

  testStream.on('end', function end() {
    t.pass();
    t.end();
  });

  testStream.write(input, 'utf8');
  testStream.end();
});

test.cb('should return objects (transform)', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = [
    {chunk: 'The', match: true},
    {chunk: ' '},
    {chunk: 'quick', match: true},
    {chunk: ' '},
    {chunk: 'brown', match: true},
    {chunk: ' '},
    {chunk: 'fox', match: true},
    {chunk: ' '},
    {chunk: 'jumps', match: true},
    {chunk: ' '},
    {chunk: 'over', match: true},
    {chunk: ' '},
    {chunk: 'the', match: true},
    {chunk: ' '},
    {chunk: 'lazy', match: true},
    {chunk: ' '},
    {chunk: 'dog', match: true},
    {chunk: '.'},
  ];
  const testStream = new RegexStream(/\w+/);
  let index = 0;

  testStream.on('readable', function read() {
    let content = null;
    while ((content = this.read()) !== null) {
      t.same(content.chunk, expected[index].chunk);
      if (expected[index].match) {
        t.ok(content.match);
      } else {
        t.notOk(content.match);
      }
      index += 1;
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  input.match(/.{1,3}/g).forEach((chunk) => {
    testStream.write(chunk, 'utf8');
  });
  testStream.end();
});

test.cb('should return objects (flush)', (t) => {
  const input = 'a (fox) a (dog) a (cat)';
  const expected = [
    {chunk: 'a '},
    {chunk: '(fox)', match: true},
    {chunk: ' a '},
    {chunk: '(dog)', match: true},
    {chunk: ' a '},
    {chunk: '(cat)', match: true},
  ];
  const testStream = new RegexStream(/\(\w+\)/i);
  let index = 0;

  testStream.on('readable', function read() {
    let content = null;
    while ((content = this.read()) !== null) {
      t.same(content.chunk, expected[index].chunk);
      if (expected[index].match) {
        t.ok(content.match);
      } else {
        t.notOk(content.match);
      }
      index += 1;
    }
  });

  testStream.on('end', function end() {
    t.same(expected.length, index);
    t.end();
  });

  input.match(/.{1,14}/g).forEach(function split(chunk) {
    testStream.write(chunk, 'utf8');
  });
  testStream.end();
});


test.cb('should return tokenised input', (t) => {
  const input = ':[](a.md) :[](b.md) :[](c.md) :[](d.md) :[](e.md) :[](f.md) :[](g.md)\n';
  const expected = [
    {chunk: ':[](a.md)', match: true},
    {chunk: ' '},
    {chunk: ':[](b.md)', match: true},
    {chunk: ' '},
    {chunk: ':[](c.md)', match: true},
    {chunk: ' '},
    {chunk: ':[](d.md)', match: true},
    {chunk: ' '},
    {chunk: ':[](e.md)', match: true},
    {chunk: ' '},
    {chunk: ':[](f.md)', match: true},
    {chunk: ' '},
    {chunk: ':[](g.md)', match: true},
    {chunk: '\n'},
  ];
  const testStream = new RegexStream(linkRegExp);
  let index = 0;

  testStream.on('readable', function read() {
    let content = null;
    while ((content = this.read()) !== null) {
      t.same(content.chunk, expected[index].chunk);
      if (expected[index].match) {
        t.ok(content.match);
      } else {
        t.notOk(content.match);
      }
      index += 1;
    }
  });

  testStream.on('end', function end() {
    t.same(expected.length, index);
    t.end();
  });

  testStream.write(input, 'utf8');
  testStream.end();
});
