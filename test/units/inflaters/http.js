import test from 'ava';
import nock from 'nock';
import concat from 'concat-stream';
global.fs = require('fs');

import httpInflater from '../../../src/inflaters/http';

test.before(() => {
  nock('http://github.com').get('/foo.md').reply(200, 'foo\nbar\n');
  nock('http://github.com').get('/i-dont-exist.md').reply(404);
});

test.cb('should return stream with contents of the file without trailing new line', (t) => {
  const link = 'http://github.com/foo.md';
  const testStream = httpInflater(link);

  t.plan(1);

  const concatStream = concat((result) => {
    t.deepEqual(result.toString('utf8'), 'foo\nbar');
    t.end();
  });

  testStream.pipe(concatStream);
});

test.cb('should emit error if file not found', (t) => {
  const link = 'http://github.com/i-don-exist.md';
  const testStream = httpInflater(link);

  t.plan(1);

  testStream.on('error', (err) => {
    t.truthy(err);
    t.end();
  });

  testStream.read();
});
