import test from 'ava';
import sinon from 'sinon';
import spigot from 'stream-spigot';

import ResolveStream from '../../src/resolve-stream';

import * as resolver from '../../src/resolver';

// global.fs = require('fs');

// TODO: directly mock inflate logic
// test.before(() => {
//   const foxStream = new Readable();
//   foxStream.push('fox');
//   foxStream.push(null);
//
//   const fooStream = new Readable();
//   fooStream.push('foo');
//   fooStream.push(null);
//
//   const animalStream = new Readable();
//   animalStream.push(':[bad link](vulpes.md)');
//   animalStream.push(null);
//
//   const stub = sinon.stub(global.fs, 'createReadStream');
//   stub.withArgs('/foo/fox.md', { encoding: 'utf8' }).returns(foxStream);
//   stub.withArgs('/bar.md', { encoding: 'utf8' }).returns(fooStream);
//   stub.withArgs('/foo/animal.md', { encoding: 'utf8' }).returns(animalStream);
// });
//
// test.after(() => {
//   global.fs.createReadStream.restore();
// });

test.beforeEach((t) => {
  t.context.sandbox = sinon.sandbox.create();
});

test.afterEach((t) => {
  t.context.sandbox.restore();
});


test.cb('handle no input', (t) => {
  const testStream = new ResolveStream();

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

test.cb('handle chunk without url', (t) => {
  const input = [{ content: 'The quick brown fox jumps over the lazy dog./n' }];
  const resolve = new ResolveStream('/foo/bar.md');

  resolve.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.falsy(chunk.link);
    }
  });

  resolve.on('error', () => t.fail());
  resolve.on('end', () => t.end());

  spigot({ objectMode: true }, input).pipe(resolve);
});

test.serial.cb('resolve simple link to content', (t) => {
  t.context.sandbox.stub(resolver, 'parseContent').returns({
    contentLink: {
      url: 'fox.md',
      placeholder: 'fox.md',
      source: '/foo/bar.md',
      line: 1,
      column: 0,
    },
    scopeReferences: [],
    descendantReferences: [],
  });
  t.context.sandbox.stub(resolver, 'resolveToReadableStream').returns({
    contentStream: spigot.array(['ABCDEFG\n']),
    resolvedUrl: '/foo/fox.md',
  });

  const input = [{
    content: ':[](fox.md)',
    link: 'fox.md',
  }];
  const expected = [
    {
      indent: '',
      content: 'ABCDEFG\n',
      source: '/foo/fox.md',
      line: 1,
      column: 0,
      parents: [],
    },
    {
      indent: '',
      content: '',
      source: '/foo/fox.md',
      line: 2,
      column: 0,
      parents: [],
    },
  ];
  const output = [];
  const resolve = new ResolveStream('/foo/bar.md');

  resolve.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output.push(chunk);
    }
  });

  resolve.on('error', () => t.fail());
  resolve.on('end', () => {
    t.deepEqual(output, expected);
    t.end();
  });

  spigot({ objectMode: true }, input).pipe(resolve);
});

test.serial.cb('should emit error if circular dependency detected', (t) => {
  t.context.sandbox.stub(resolver, 'parseContent').returns({
    contentLink: {
      url: 'fox.md',
      placeholder: 'fox.md',
      source: '/foo/bar.md',
      line: 1,
      column: 0,
    },
    scopeReferences: [],
    descendantReferences: [],
  });
  t.context.sandbox.stub(resolver, 'resolveToReadableStream').returns({
    resolvedUrl: '/foo/fox.md',
  });

  const input = [{
    content: ':[](fox.md)',
    link: 'fox.md',
    parents: ['/foo/fox.md'],
  }];
  const resolve = new ResolveStream('/foo/bar.md');

  resolve.on('readable', function read() {
    this.read();
  });
  resolve.on('error', () => {
    t.pass();
    t.end();
  });

  spigot({ objectMode: true }, input).pipe(resolve);
});

// test.cb('should support custom linkResolver function', (t) => {
//   const input = {
//     content: ':[](fox.md)',
//     link: 'fox.md',
//     relativePath: '/foo',
//     parents: [],
//   };
//   function resolveLink({ link, relativePath, parents, source, line, column }, cb) {
//     const resolvedLink = path.join(relativePath, link);
//     const resolvedRelativePath = path.dirname(resolvedLink);
//
//     const fooStream = new Readable();
//     if (link === 'fox.md') {
//       fooStream.push(':[](animal.md)');
//     } else {
//       fooStream.push('foo');
//     }
//     fooStream.push(null);
//
//     return cb(null, fooStream, resolvedLink, resolvedRelativePath);
//   }
//   const expected = {
//     indent: '',
//     content: 'foo',
//     source: '/foo/animal.md',
//     line: 1,
//     column: 0,
//     parents: ['/foo/fox.md', '/foo/bar.md', '/foo/fox.md'],
//   };
//
//   const testStream = new ResolveStream('/foo/bar.md', { resolveLink });
//
//   t.plan(1);
//   testStream.on('readable', function read() {
//     let chunk = null;
//     while ((chunk = this.read()) !== null) {
//       t.deepEqual(chunk, expected);
//     }
//   });
//   testStream.on('error', () => t.fail());
//   testStream.on('end', () => t.end());
//
//   testStream.write(input);
//   testStream.end();
// });

// test.cb('should ignore linkResolver that isn\'t a function', (t) => {
//   const input = {
//     content: ':[](bar.md)',
//     link: 'bar.md',
//     relativePath: '/',
//   };
//   const resolveLink = {};
//   const expected = {
//     indent: '',
//     content: 'foo',
//     source: '/bar.md',
//     line: 1,
//     column: 0,
//     parents: ['/foo.md'],
//   };
//   const testStream = new ResolveStream('/foo.md', { resolveLink });
//
//   t.plan(1);
//   testStream.on('readable', function read() {
//     let chunk = null;
//     while ((chunk = this.read()) !== null) {
//       t.deepEqual(chunk, expected);
//     }
//   });
//   testStream.on('error', () => t.fail());
//   testStream.on('end', () => t.end());
//
//   testStream.write(input);
//   testStream.end();
// });
