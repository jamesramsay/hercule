import test from 'ava';
import sinon from 'sinon';
import isString from 'lodash/isString';
import constant from 'lodash/constant';
import { Readable } from 'stream';
import isStream from 'isstream';
import nock from 'nock';

import * as resolver from '../../lib/resolver';

global.fs = require('fs');

test.beforeEach(t => {
  t.context.sandbox = sinon.createSandbox();
});

test.afterEach(t => {
  t.context.sandbox.restore();
});

test('handles url resolved to string', t => {
  const resolvers = [() => ({ content: 'bar' })];
  const { contentStream, resolvedUrl } = resolver.resolveToReadableStream(
    { url: '"foo.md"', source: 'bar.md' },
    resolvers
  );

  t.falsy(resolvedUrl);
  t.truthy(isStream(contentStream));
});

test('handles url resolved to stream', t => {
  const resolvers = [() => ({ content: new Readable() })];

  const { contentStream, resolvedUrl } = resolver.resolveToReadableStream(
    { url: 'foo.md' },
    resolvers
  );

  t.falsy(resolvedUrl);
  t.truthy(isStream(contentStream));
});

test('calls resolvers with placeholder', t => {
  const resolvers = [(url, source, placeholder) => ({ content: placeholder })];
  const { contentStream, resolvedUrl } = resolver.resolveToReadableStream(
    { url: '"foo.md"', source: 'bar.md' },
    resolvers,
    ':[](foo.md)'
  );

  t.falsy(resolvedUrl);
  t.truthy(isStream(contentStream));
});

test('throws if not resolved', t => {
  const resolvers = [() => constant(null)];
  const error = t.throws(() =>
    resolver.resolveToReadableStream({ url: 'foo' }, resolvers)
  );
  t.is(error.message, "no readable stream or string, resolve 'foo'");
});

test('returns stream if http url', t => {
  nock('https://127.0.0.1').get('/').reply(200, 'Hello World!\n');

  const { content } = resolver.resolveHttpUrl('https://127.0.0.1/');
  t.truthy(isStream(content));
});

test('returns falsy if not http url', t => {
  t.falsy(resolver.resolveHttpUrl('foo.md'));
});

test('returns stream if local url', t => {
  t.context.sandbox.stub(global.fs, 'createReadStream');
  global.fs.createReadStream.returns(new Readable());

  const { content, url } = resolver.resolveLocalUrl('bar.md', '/foo/foo.md');
  t.truthy(isStream(content));
  t.is(url, '/foo/bar.md');
});

test('returns falsy if not local url', t => {
  t.falsy(resolver.resolveLocalUrl('"fizzbuzz"', '/foo/foo.md'));
});

test('returns string if quoted input', t => {
  const { content } = resolver.resolveString('"foo! bar!"');
  t.truthy(isString(content));
});

test('returns falsy if unquoted input', t => {
  t.falsy(resolver.resolveString('fizzbuzz'));
});
