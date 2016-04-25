import test from 'ava';
import sinon from 'sinon';
import nock from 'nock';
import concat from 'concat-stream';
import { resolveLink } from '../../../src/resolve';
import { Readable } from 'stream';

test.before(() => {
  const localStream = new Readable;
  localStream.push('local!');
  localStream.push(null);

  global.fs = require('fs');
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

  resolveLink(link, relativePath, (err, input, resolvedLink, resolvedRelativePath) => {
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

  resolveLink(link, relativePath, (err, input, resolvedLink, resolvedRelativePath) => {
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

  resolveLink(link, relativePath, (err, input) => {
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

  resolveLink(link, relativePath, (err, input, resolvedLink, resolvedRelativePath) => {
    t.ifError(err);
    t.deepEqual(resolvedLink, null);
    t.deepEqual(resolvedRelativePath, null);

    const concatStream = concat((result) => {
      t.deepEqual(result.toString('utf8'), 'foo bar');
      t.end();
    });

    input.pipe(concatStream);
  });
});
