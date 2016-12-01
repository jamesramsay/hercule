import test from 'ava';
import sinon from 'sinon';
import _ from 'lodash';
import { Readable } from 'stream';
import isStream from 'isstream';

import * as pegjs from '../../src/grammar';
import * as resolver from '../../src/resolver';

global.fs = require('fs');

test.beforeEach((t) => {
  t.context.sandbox = sinon.sandbox.create();
});

test.afterEach((t) => {
  t.context.sandbox.restore();
});

test('handles url resolved to string', (t) => {
  const resolvers = [() => ({ content: 'bar' })];
  const { contentStream, resolvedUrl } =
    resolver.resolveToReadableStream({ url: '"foo.md"', source: 'bar.md' }, resolvers);

  t.falsy(resolvedUrl);
  t.truthy(isStream(contentStream));
});

test('handles url resolved to stream', (t) => {
  const resolvers = [() => ({ content: new Readable() })];

  const { contentStream, resolvedUrl } =
    resolver.resolveToReadableStream({ url: 'foo.md' }, resolvers);

  t.falsy(resolvedUrl);
  t.truthy(isStream(contentStream));
});

test('throws if not resolved', (t) => {
  const resolvers = [() => _.constant(null)];
  const error = t.throws(() => resolver.resolveToReadableStream({ url: 'foo' }, resolvers));
  t.is(error.message, 'no readable stream or string, resolve \'foo\'');
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
  const parsedContent = resolver.parseContent('', { source, line: 1, column: 0 });
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

  const parsedContent = resolver.parseContent('', { source, line: 1, column: 0 });
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

test('returns stream if http url', (t) => {
  const { content } = resolver.resolveHttpUrl('https://127.0.0.1');
  t.truthy(isStream(content));
});

test('returns falsy if not http url', (t) => {
  t.falsy(resolver.resolveHttpUrl('foo.md'));
});

test('returns stream if local url', (t) => {
  t.context.sandbox.stub(global.fs, 'createReadStream');
  global.fs.createReadStream.returns(new Readable());

  const { content, url } = resolver.resolveLocalUrl('bar.md', '/foo/foo.md');
  t.truthy(isStream(content));
  t.is(url, '/foo/bar.md');
});

test('returns falsy if not local url', (t) => {
  t.falsy(resolver.resolveLocalUrl('"fizzbuzz"', '/foo/foo.md'));
});

test('returns string if quoted input', (t) => {
  const { content } = resolver.resolveString('"foo! bar!"');
  t.truthy(_.isString(content));
});

test('returns falsy if unquoted input', (t) => {
  t.falsy(resolver.resolveString('fizzbuzz'));
});
