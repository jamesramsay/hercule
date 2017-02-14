import test from 'ava';
import sinon from 'sinon';
import { Readable } from 'stream';
import spigot from 'stream-spigot';
import get from 'through2-get';
import getStream from 'get-stream';

import transclude from '../../src/transclude';
import * as parse from '../../src/parse';
import * as pegjs from '../../src/grammar';

test.beforeEach((t) => {
  t.context.sandbox = sinon.sandbox.create();
});

test.afterEach((t) => {
  t.context.sandbox.restore();
});

test.cb('should pass through objects unmodified', (t) => {
  const input = [{ content: 'Hello world!' }];
  const testStream = transclude();

  spigot({ objectMode: true }, input).pipe(testStream);

  getStream.array(testStream)
    .then((output) => {
      t.deepEqual(output, input);
      t.end();
    })
    .catch(err => t.fail(err));
});

test.cb('should split strings after new lines', (t) => {
  const input = ['The quick ', 'brown fox\r\njumps over', ' the lazy dog.\n'];
  const expected = ['The quick brown fox\r\n', 'jumps over the lazy dog.\n'];
  const testStream = transclude();
  const stringify = get('content');

  spigot({ objectMode: true }, input).pipe(testStream).pipe(stringify);

  getStream.array(stringify)
    .then((output) => {
      t.deepEqual(output, expected);
      t.end();
    })
    .catch(err => t.fail(err));
});

test.serial.cb('should locate link within content', (t) => {
  t.context.sandbox.spy(parse, 'parseContent');

  const input = ['Fizz :[foo]', '(foo.md) bar\nbuzz :[bar](bar.md)\n'];
  const expected = ['Fizz ', 'zing', ' bar\n', 'buzz ', 'zing', '\n'];
  const testStream = transclude('string', { resolvers: [() => ({ content: 'zing', url: 'baz.md' })] });
  const stringify = get('content');

  spigot({ objectMode: true }, input).pipe(testStream).pipe(stringify);

  getStream.array(stringify)
    .then((output) => {
      t.is(parse.parseContent.firstCall.args[0], 'foo.md');
      t.is(parse.parseContent.secondCall.args[0], 'bar.md');
      t.deepEqual(output, expected);
      t.end();
    })
    .catch(err => t.fail(err));
});

test.cb('throws on invalid link', (t) => {
  const input = [':[foo](foo .md)'];
  const testStream = transclude();

  spigot({ objectMode: true }, input).pipe(testStream);

  getStream.array(testStream)
    .then(() => t.fail('expected error'))
    .catch((err) => {
      t.is(err.message, 'Link could not be parsed');
      t.end();
    });
});

test.cb('throws on circular reference', (t) => {
  const input = [':[foo](foo.md)'];
  const testStream = transclude('foo.md', { resolvers: [() => ({ content: new Readable(), url: 'foo.md' })] });

  spigot({ objectMode: true }, input).pipe(testStream);

  getStream.array(testStream)
    .then(() => t.fail('expected error'))
    .catch((err) => {
      t.is(err.message, 'Circular dependency detected');
      t.end();
    });
});

test.serial('should parse a simple link', (t) => {
  // link: 'animal.md'
  const source = '/foo/bar.md';

  t.context.sandbox.stub(pegjs.grammar, 'parse');
  pegjs.grammar.parse.returns({
    link: {
      url: 'animal.md',
      placeholder: 'animal.md',
      index: 0,
    },
    scopeReferences: [],
    descendantReferences: [],
  });
  const expectedLink = {
    source,
    url: 'animal.md',
    placeholder: 'animal.md',
    line: 1,
    column: 0,
  };

  // We're really testing ability to extend parse output with source information
  const parsedContent = parse.parseContent('', { source, line: 1, column: 0 });
  const { contentLink, scopeReferences, descendantReferences } = parsedContent;
  t.deepEqual(contentLink, expectedLink);
  t.deepEqual(scopeReferences, []);
  t.deepEqual(descendantReferences, []);
});

test.serial('should parse a complex link', (t) => {
  // link: 'animal || dog.md wolf:canis-lupus.md'
  const source = '/foo/bar.md';

  t.context.sandbox.stub(pegjs.grammar, 'parse');
  pegjs.grammar.parse.returns({
    link: {
      url: 'animal',
      placeholder: 'animal',
      index: 0,
    },
    scopeReferences: [{
      url: 'dog.md',
      placeholder: 'animal',
      index: 10,
    }],
    descendantReferences: [{
      url: 'canis-lupus.md',
      placeholder: 'wolf',
      index: 22,
    }],
  });

  const parsedContent = parse.parseContent('', { source, line: 1, column: 0 });
  const { contentLink, scopeReferences, descendantReferences } = parsedContent;

  t.deepEqual(contentLink, {
    source,
    url: 'animal',
    placeholder: 'animal',
    line: 1,
    column: 0,
  });
  t.deepEqual(scopeReferences, [{
    source,
    url: 'dog.md',
    placeholder: 'animal',
    line: 1,
    column: 10,
  }]);
  t.deepEqual(descendantReferences, [{
    source,
    url: 'canis-lupus.md',
    placeholder: 'wolf',
    line: 1,
    column: 22,
  }]);
});
