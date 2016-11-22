import test from 'ava';
import nock from 'nock';
import concat from 'concat-stream';

import httpInflater from '../../../src/inflaters/http';

global.fs = require('fs');

test.before(() => {
  nock('http://github.com').get('/foo.md').reply(200, 'foo\nbar\n');
});

test.cb('should return stream with contents of the file', (t) => {
  const link = 'http://github.com/foo.md';
  const testStream = httpInflater(link);

  t.plan(1);

  const concatStream = concat((result) => {
    t.deepEqual(result.toString('utf8'), 'foo\nbar\n');
    t.end();
  });

  testStream.pipe(concatStream);
});
