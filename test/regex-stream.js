import test from 'ava';
import _ from 'lodash';
import {LINK_REGEXP, LINK_GROUP, WHITESPACE_GROUP} from '../lib/config';
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
    {content: 'The', match: true},
    {content: ' '},
    {content: 'quick', match: true},
    {content: ' '},
    {content: 'brown', match: true},
    {content: ' '},
    {content: 'fox', match: true},
    {content: ' '},
    {content: 'jumps', match: true},
    {content: ' '},
    {content: 'over', match: true},
    {content: ' '},
    {content: 'the', match: true},
    {content: ' '},
    {content: 'lazy', match: true},
    {content: ' '},
    {content: 'dog', match: true},
    {content: '.'},
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
    {content: 'a '},
    {content: '(fox)', match: true},
    {content: ' a '},
    {content: '(dog)', match: true},
    {content: ' a '},
    {content: '(cat)', match: true},
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
    {content: ':[](a.md)', match: true},
    {content: ' '},
    {content: ':[](b.md)', match: true},
    {content: ' '},
    {content: ':[](c.md)', match: true},
    {content: ' '},
    {content: ':[](d.md)', match: true},
    {content: ' '},
    {content: ':[](e.md)', match: true},
    {content: ' '},
    {content: ':[](f.md)', match: true},
    {content: ' '},
    {content: ':[](g.md)', match: true},
    {content: '\n'},
  ];
  const testStream = new RegexStream(LINK_REGEXP);
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


test.cb('should return restructed match', (t) => {
  const input = '  :[foo](bar.md)';
  const expected = {
    content: '  :[foo](bar.md)',
    link: 'bar.md',
    indent: '__  ',
  };
  const options = {
    match: {
      link: `${LINK_GROUP}`,
      indent: (match) => {
        return ['__', _.get(match, `${WHITESPACE_GROUP}`)].join('');
      },
      number: 2,
    },
  };
  const testStream = new RegexStream(LINK_REGEXP, options);

  testStream.on('readable', function read() {
    let output = null;
    while ((output = this.read()) !== null) {
      t.same(output, expected);
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  testStream.write(input, 'utf8');
  testStream.end();
});


test.cb('should leave behind leading whitespace', (t) => {
  const input = '  :[foo](bar.md)';
  const expected = [
    {
      content: '  ',
    },
    {
      content: '  :[foo](bar.md)',
      link: 'bar.md',
      indent: '  ',
    },
  ];
  const options = {
    match: {
      link: `${LINK_GROUP}`,
      indent: `${WHITESPACE_GROUP}`,
    },
    leaveBehind: `${WHITESPACE_GROUP}`,
  };
  const testStream = new RegexStream(LINK_REGEXP, options);
  let index = 0;

  testStream.on('readable', function read() {
    let output = null;
    while ((output = this.read()) !== null) {
      t.same(output, expected[index]);
      index += 1;
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  testStream.write(input, 'utf8');
  testStream.end();
});
