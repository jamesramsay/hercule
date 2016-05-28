import test from 'ava';
import sinon from 'sinon';
import nock from 'nock';
import concat from 'concat-stream';
import { resolveLink } from '../../../src/resolve';
import { Readable } from 'stream';
global.fs = require('fs');

test.before(() => {
  const localStream = new Readable;
  localStream.push('local!');
  localStream.push(null);

  sinon.stub(global.fs, 'createReadStream')
    .withArgs('/foo/animal.md', { encoding: 'utf8' })
    .returns(localStream);

  nock('http://github.com').get('/a.md').reply(200, 'remote!');
  nock('http://github.com').get('/i-dont-exist.md').reply(404);
});

test.after(() => {
  global.fs.createReadStream.restore();
});


test.cb('should resolve local file link', (t) => {
  const link = 'animal.md';
  const relativePath = '/foo';
  const source = '/foo/bar.md';

  resolveLink({ link, relativePath, source }, (err, input, resolvedLink, resolvedRelativePath) => {
    t.ifError(err);
    t.deepEqual(resolvedLink, '/foo/animal.md');
    t.deepEqual(resolvedRelativePath, relativePath);

    const concatStream = concat((result) => {
      t.deepEqual(result.toString('utf8'), 'local!');
      t.end();
    });

    input.pipe(concatStream);
  });
});

test.cb('should resolve http link', (t) => {
  const link = 'http://github.com/a.md';
  const relativePath = '/foo';
  const source = '/foo/bar.md';

  resolveLink({ link, relativePath, source }, (err, input, resolvedLink, resolvedRelativePath) => {
    t.ifError(err);
    t.deepEqual(resolvedLink, link);
    t.deepEqual(resolvedRelativePath, link);

    const concatStream = concat((result) => {
      t.deepEqual(result.toString('utf8'), 'remote!');
      t.end();
    });

    input.pipe(concatStream);
  });
});

test.cb('should emit error on invalid http link', (t) => {
  const link = 'http://github.com/i-dont-exist.md';
  const relativePath = '/foo';
  const source = '/foo/bar.md';

  resolveLink({ link, relativePath, source }, (err, input) => {
    input.on('error', (inputErr) => {
      t.deepEqual(inputErr.message, 'Could not read file');
      t.deepEqual(inputErr.path, link);
      t.end();
    });

    const concatStream = concat((result) => {
      t.truthy(result.toString('utf8'));
    });

    input.pipe(concatStream);
  });
});

test.cb('should resolve string link', (t) => {
  const link = '"foo bar"';
  const relativePath = '/foo';
  const source = '/foo/bar.md';

  resolveLink({ link, relativePath, source }, (err, input, resolvedLink, resolvedRelativePath) => {
    t.ifError(err);
    t.falsy(resolvedLink);
    t.falsy(resolvedRelativePath);

    input.on('error', () => t.fail());

    const concatStream = concat((result) => {
      t.deepEqual(result, [{ content: 'foo bar', source }]);
      t.end();
    });

    input.pipe(concatStream);
  });
});
