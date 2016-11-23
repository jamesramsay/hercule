import test from 'ava';
import path from 'path';
import sinon from 'sinon';
import { Readable } from 'stream';

import ResolveStream from '../../src/resolve-stream';

global.fs = require('fs');

// TODO: directly mock inflate logic
test.before(() => {
  const foxStream = new Readable();
  foxStream.push('fox');
  foxStream.push(null);

  const fooStream = new Readable();
  fooStream.push('foo');
  fooStream.push(null);

  const animalStream = new Readable();
  animalStream.push(':[bad link](vulpes.md)');
  animalStream.push(null);

  const stub = sinon.stub(global.fs, 'createReadStream');
  stub.withArgs('/foo/fox.md', { encoding: 'utf8' }).returns(foxStream);
  stub.withArgs('/bar.md', { encoding: 'utf8' }).returns(fooStream);
  stub.withArgs('/foo/animal.md', { encoding: 'utf8' }).returns(animalStream);
});

test.after(() => {
  global.fs.createReadStream.restore();
});


test.cb('should handle no input', (t) => {
  const testStream = new ResolveStream();

  t.plan(1);
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

test.cb('should handle input without link', (t) => {
  const input = { content: 'The quick brown fox jumps over the lazy dog./n' };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.falsy(chunk.link);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});

test.cb('should resolve simple link to content', (t) => {
  const input = {
    content: ':[](fox.md)',
    link: 'fox.md',
    relativePath: '/foo',
  };
  const expected = {
    indent: '',
    content: 'fox',
    source: '/foo/fox.md',
    line: 1,
    column: 0,
    parents: ['/foo/bar.md'],
  };
  const testStream = new ResolveStream('/foo/bar.md');

  t.plan(1);
  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.deepEqual(chunk, expected);
    }
  });
  testStream.on('error', () => t.fail());
  testStream.on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});

test.cb('should emit error if circular dependency detected', (t) => {
  const input = {
    content: ':[](fox.md)',
    link: 'fox.md',
    relativePath: '/foo',
    parents: ['/foo/fox.md'],
  };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream.on('readable', function read() {
    this.read();
  });
  testStream.on('error', () => t.pass());
  testStream.on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});

test.cb('should support custom linkResolver function', (t) => {
  const input = {
    content: ':[](fox.md)',
    link: 'fox.md',
    relativePath: '/foo',
    parents: [],
  };
  function resolveLink({ link, relativePath, parents, source, line, column }, cb) {
    const resolvedLink = path.join(relativePath, link);
    const resolvedRelativePath = path.dirname(resolvedLink);

    const fooStream = new Readable();
    if (link === 'fox.md') {
      fooStream.push(':[](animal.md)');
    } else {
      fooStream.push('foo');
    }
    fooStream.push(null);

    return cb(null, fooStream, resolvedLink, resolvedRelativePath);
  }
  const expected = {
    indent: '',
    content: 'foo',
    source: '/foo/animal.md',
    line: 1,
    column: 0,
    parents: ['/foo/fox.md', '/foo/bar.md', '/foo/fox.md'],
  };

  const testStream = new ResolveStream('/foo/bar.md', { resolveLink });

  t.plan(1);
  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.deepEqual(chunk, expected);
    }
  });
  testStream.on('error', () => t.fail());
  testStream.on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});

test.cb('should ignore linkResolver that isn\'t a function', (t) => {
  const input = {
    content: ':[](bar.md)',
    link: 'bar.md',
    relativePath: '/',
  };
  const resolveLink = {};
  const expected = {
    indent: '',
    content: 'foo',
    source: '/bar.md',
    line: 1,
    column: 0,
    parents: ['/foo.md'],
  };
  const testStream = new ResolveStream('/foo.md', { resolveLink });

  t.plan(1);
  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.deepEqual(chunk, expected);
    }
  });
  testStream.on('error', () => t.fail());
  testStream.on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});
