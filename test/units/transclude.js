import test from 'ava';
import sinon from 'sinon';
import { Readable } from 'stream';
import spigot from 'stream-spigot';

import transclude from '../../src/transclude';
import * as resolver from '../../src/resolver';

test.beforeEach((t) => {
  t.context.sandbox = sinon.sandbox.create();
});

test.afterEach((t) => {
  t.context.sandbox.restore();
});

test.cb('should pass through objects unmodified', (t) => {
  const input = [{ content: 'Hello world!' }];
  const testStream = transclude();
  const output = [];

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output.push(chunk);
    }
  });

  testStream.on('end', () => {
    t.deepEqual(output, input);
    t.end();
  });

  spigot({ objectMode: true }, input).pipe(testStream);
});

test.cb('should split strings after new lines', (t) => {
  const input = ['The quick ', 'brown fox\r\njumps over', ' the lazy dog.\n'];
  const expected = ['The quick brown fox\r\n', 'jumps over the lazy dog.\n'];
  const testStream = transclude();
  const output = [];

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output.push(chunk.content);
    }
  });

  testStream.on('end', () => {
    t.deepEqual(output, expected);
    t.end();
  });

  spigot({ objectMode: true }, input).pipe(testStream);
});

test.serial.cb('should locate link within content', (t) => {
  t.context.sandbox.spy(resolver, 'parseContent');

  const input = ['Fizz :[foo]', '(foo.md) bar\nbuzz :[bar](bar.md)\n'];
  const expected = ['Fizz ', 'zing', ' bar\n', 'buzz ', 'zing', '\n'];
  const testStream = transclude('string', { resolvers: [() => ({ content: 'zing', url: 'baz.md' })] });
  const output = [];

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output.push(chunk.content);
    }
  });

  testStream.on('end', () => {
    t.is(resolver.parseContent.firstCall.args[0], 'foo.md');
    t.is(resolver.parseContent.secondCall.args[0], 'bar.md');
    t.deepEqual(output, expected);
    t.end();
  });

  spigot({ objectMode: true }, input).pipe(testStream);
});

test.cb('throws on invalid link', (t) => {
  const input = [':[foo](foo .md)'];
  const testStream = transclude();
  const output = [];

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output.push(chunk.content);
    }
  });
  t.plan(1);
  testStream.on('error', err => t.is(err.message, 'Link could not be parsed'));
  testStream.on('end', () => t.end());

  spigot({ objectMode: true }, input).pipe(testStream);
});

test.cb('throws on circular reference', (t) => {
  const input = [':[foo](foo.md)'];
  const testStream = transclude('foo.md', { resolvers: [() => ({ content: new Readable(), url: 'foo.md' })] });
  const output = [];

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output.push(chunk.content);
    }
  });
  t.plan(1);
  testStream.on('error', err => t.is(err.message, 'Circular dependency detected'));
  testStream.on('end', () => t.end());

  spigot({ objectMode: true }, input).pipe(testStream);
});

// test.cb('should extend with source, parents, references, and cursor information', (t) => {
//   const input = 'Quartz sphinx';
//   const expected = [
//     {
//       content: 'Quartz',
//       source: 'text.md',
//       parents: ['index.md', 'text.md'],
//       references: [],
//       indent: '',
//       line: 1,
//       column: 0,
//     },
//     {
//       content: ' ',
//       source: 'text.md',
//       parents: ['index.md'],
//       indent: '',
//       line: 1,
//       column: 6,
//     },
//     {
//       content: 'sphinx',
//       source: 'text.md',
//       parents: ['index.md', 'text.md'],
//       references: [],
//       indent: '',
//       line: 1,
//       column: 7,
//     },
//   ];
//   const words = tokenizer(/\w+/g, 'text.md', ['index.md']);
//   const output = [];
//
//   words.on('readable', function read() {
//     let chunk = null;
//     while ((chunk = this.read()) !== null) {
//       output.push(chunk);
//     }
//   });
//
//   words.on('end', () => {
//     t.deepEqual(output, expected);
//     t.end();
//   });
//
//   const inputChunks = input.match(/.{1,3}/g);
//   _.forEach(inputChunks, chunk => words.write(chunk, 'utf8'));
//   words.end();
// });
//
// test.cb('should tokenize transclusion link', (t) => {
//   const input = 'Jackdaws love my sphinx of :[material](crystal.md)';
//   const expected = [
//     {
//       content: 'Jackdaws love my sphinx of ',
//       source: 'index.md',
//       parents: [],
//       indent: '',
//       line: 1,
//       column: 0,
//     },
//     {
//       content: ':[material](crystal.md)',
//       link: 'crystal.md',
//       source: 'index.md',
//       parents: ['index.md'],
//       references: [],
//       indent: '',
//       line: 1,
//       column: 27,
//     },
//   ];
//   const words = tokenizer(/((^[\t ]*)?:\[.*?]\((.*?)\))/gm, 'index.md');
//   const output = [];
//
//   words.on('readable', function read() {
//     let chunk = null;
//     while ((chunk = this.read()) !== null) {
//       output.push(chunk);
//     }
//   });
//
//   words.on('end', () => {
//     t.deepEqual(output, expected);
//     t.end();
//   });
//
//   const inputChunks = input.match(/.{1,3}/g);
//   _.forEach(inputChunks, chunk => words.write(chunk, 'utf8'));
//   words.end();
// });
