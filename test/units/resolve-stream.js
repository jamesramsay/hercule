import test from 'ava';
import sinon from 'sinon';
import { Readable } from 'stream';

import ResolveStream from '../../src/resolve-stream';

global.fs = require('fs');

// TODO: directly mock inflate logic
test.before(() => {
  const foxStream = new Readable;
  foxStream.push('fox');
  foxStream.push(null);

  const animalStream = new Readable;
  animalStream.push(':[bad link](vulpes.md)');
  animalStream.push(null);

  const stub = sinon.stub(global.fs, 'createReadStream');
  stub.withArgs('/foo/fox.md', { encoding: 'utf8' }).returns(foxStream);
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

test.cb('should resolve simple link to content and emit source', (t) => {
  const input = {
    content: ':[](fox.md)',
    link: 'fox.md',
    relativePath: '/foo',
  };
  const expected = {
    indent: '',
    content: 'fox',
    line: 1,
    column: 0,
  };
  const testStream = new ResolveStream();

  t.plan(2);
  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.deepEqual(chunk, expected);
    }
  });
  testStream.on('error', () => t.fail());
  testStream.on('source', (source) => t.deepEqual(source, 'fox.md'));
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
