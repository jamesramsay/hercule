import test from 'ava';
import path from 'path';
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
        t.falsy(chunk.link);
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
    link: '../fixtures/local-link/index.md',
    relativePath: __dirname,
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
      t.deepEqual(output, expected);
      t.end();
    });

  testStream.write(input);
  testStream.end();
});


test.cb('should emit error with invalid file link', (t) => {
  const input = {
    content: ':[Example](size.md)',
    link: '/i-dont-exist.md',
    relativePath: __dirname,
    parents: [],
    references: [],
  };
  const testStream = new InflateStream();

  t.plan(2);
  testStream
    .on('readable', function read() {
      this.read();
    })
    .on('error', (err) => {
      t.deepEqual(err.message, 'Could not read file');
      t.regex(err.path, /i-dont-exist\.md/);
    })
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should inflate input with string link', (t) => {
  const input = {
    content: ':[Example](size.md)',
    link: '"tiny"',
  };
  const expected = 'tiny';
  const testStream = new InflateStream();

  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.deepEqual(chunk.content, expected);
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
    link: 'http://github.com/size.md',
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
        t.deepEqual(chunk.content, expected);
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
    link: 'http://github.com/i-dont-exist.md',
    parents: [],
    references: [],
  };
  const testStream = new InflateStream();

  nock('http://github.com').get('/i-dont-exist.md').reply(404);

  t.plan(2);
  testStream
    .on('readable', function read() {
      if (this.read() !== null) t.fail();
    })
    .on('error', (err) => {
      t.deepEqual(err.message, 'Could not read file');
      t.regex(err.path, /i-dont-exist\.md/);
    })
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should emit error on circular references', (t) => {
  const input = {
    content: ':[Circular](fox.md)',
    link: '../fixtures/circular-references/fox.md',
    relativePath: __dirname,
    parents: [path.resolve('../fixtures/circular-references/fox.md')],
    references: [],
  };
  const testStream = new InflateStream();

  t.plan(3);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.truthy(chunk);
      }
    })
    .on('error', (err) => {
      t.deepEqual(err.message, 'Circular dependency detected');
      t.deepEqual(err.path, '../fixtures/circular-references/fox.md');
    })
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});
