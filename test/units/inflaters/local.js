import test from 'ava';
import sinon from 'sinon';
import { Readable } from 'stream';
import concat from 'concat-stream';

import localInflater from '../../../src/inflaters/local';

global.fs = require('fs');

test.before(() => {
  const fooStream = new Readable();
  fooStream.push('foo\n');
  fooStream.push('bar\n');
  fooStream.push(null);

  const stub = sinon.stub(global.fs, 'createReadStream');
  stub.withArgs('foo.md', { encoding: 'utf8' }).returns(fooStream);
});

test.after(() => {
  global.fs.createReadStream.restore();
});

test.cb('should return stream with contents of the file', (t) => {
  const link = 'foo.md';
  const testStream = localInflater(link);

  t.plan(1);

  const concatStream = concat((result) => {
    t.deepEqual(result.toString('utf8'), 'foo\nbar\n');
    t.end();
  });

  testStream.pipe(concatStream);
});
