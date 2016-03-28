import path from 'path';
import test from 'ava';
import nock from 'nock';
import InflateStream from '../../lib/inflate-stream';


test.cb('should handle no input', (t) => {
  const testStream = new InflateStream();
  testStream
    .on('readable', function read() {
      if (this.read() !== null) t.fail();
    })
    .on('error', () => t.fail())
    .on('end', () => {
      t.pass();
      t.end();
    });

  testStream.end();
});


test.cb('should skip input without link', (t) => {
  const input = { content: 'The quick brown fox jumps over the lazy dog./n' };
  const testStream = new InflateStream();

  t.plan(2);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.notOk(chunk.link);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => {
      t.pass();
      t.end();
    });

  testStream.write(input);
  testStream.end();
});


test.cb('should inflate input with file link', (t) => {
  const input = {
    content: ':[Example](index.md)',
    link: {
      href: path.join(__dirname, '../fixtures/local-link/index.md'),
      hrefType: 'local',
    },
    parents: [],
    references: [],
  };
  const expected = 'Jackdaws love my big sphinx of quartz.';
  const testStream = new InflateStream();
  let output = '';

  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        output += chunk.content;
      }
    })
    .on('error', () => t.fail())
    .on('end', () => {
      t.same(output, expected);
      t.end();
    });

  testStream.write(input);
  testStream.end();
});


test.cb('should emit error with invalid file link', (t) => {
  const input = {
    content: ':[Example](size.md)',
    link: {
      href: path.join(__dirname, '/i-dont-exist.md'),
      hrefType: 'local',
    },
    parents: [],
    references: [],
  };
  const testStream = new InflateStream();

  t.plan(3);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk.content, input.content);
      }
    })
    .on('error', (err) => {
      t.same(err.msg, 'Could not read file');
      t.regex(err.path, /i-dont-exist\.md/);
    })
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should inflate input with string link', (t) => {
  const input = {
    content: ':[Example](size.md)',
    link: {
      href: 'tiny',
      hrefType: 'string',
    },
  };
  const expected = 'tiny';
  const testStream = new InflateStream();

  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk.content, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should inflate input with http link', (t) => {
  const input = {
    content: ':[Example](size.md)',
    link: {
      href: 'http://github.com/size.md',
      hrefType: 'http',
    },
    parents: [],
    references: [],
  };
  const expected = 'big';
  const testStream = new InflateStream();

  nock('http://github.com').get('/size.md').reply(200, 'big\n');

  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk.content, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should emit error with invalid http link', (t) => {
  const input = {
    content: ':[Example](size.md)',
    link: {
      href: 'http://github.com/i-dont-exist.md',
      hrefType: 'http',
    },
    parents: [],
    references: [],
  };
  const testStream = new InflateStream();

  nock('http://github.com').get('/i-dont-exist.md').reply(404);

  t.plan(1);
  testStream
    .on('readable', function read() {
      if (this.read() !== null) t.fail();
    })
    .on('error', (err) => {
      // TODO: Requires https://github.com/pgte/nock/issues/469
      // t.same(err.msg, 'Circular dependency detected');
      t.regex(err.path, /i-dont-exist\.md/);
    })
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should not make modifications if hrefType is unrecognised', (t) => {
  const input = {
    content: ':[Example](size.md)',
    link: {
      href: 'http://example.com',
      hrefType: 'null',
    },
  };
  const expected = ':[Example](size.md)';
  const testStream = new InflateStream();

  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk.content, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should emit error on circular references', (t) => {
  const input = {
    content: ':[Example](size.md)',
    link: {
      href: 'size.md',
      hrefType: 'local',
    },
    parents: ['size.md'],
  };
  const expected = ':[Example](size.md)';
  const testStream = new InflateStream();

  t.plan(3);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk.content, expected);
      }
    })
    .on('error', (err) => {
      t.same(err.msg, 'Circular dependency detected');
      t.same(err.path, 'size.md');
    })
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});
