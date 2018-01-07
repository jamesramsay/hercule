import test from 'ava';
import path from 'path';

import { transcludeString } from '../../src/hercule';

test.cb('should transclude with only required arguments', t => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  transcludeString(input, (err, output) => {
    t.deepEqual(err, null);
    t.deepEqual(output, expected);
    t.end();
  });
});

test.cb('should transclude with optional source argument', t => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  transcludeString(input, { source: 'test' }, (err, output) => {
    t.deepEqual(err, null);
    t.deepEqual(output, expected);
    t.end();
  });
});

test.cb('returns sourcemap', t => {
  const input = 'Jackdaws love my :[size link](size.md) sphinx of quartz.';
  const options = {
    source: path.join(__dirname, '../fixtures/local-link/index.md'),
  };
  const expected = 'Jackdaws love my big sphinx of quartz.';

  transcludeString(input, options, (err, output, sourcemap) => {
    t.deepEqual(err, null);
    t.deepEqual(output, expected);
    t.deepEqual(sourcemap.sources.length, 2);
    t.end();
  });
});

test.cb('returns error for invalid links', t => {
  const input =
    'Jackdaws love my :[missing](i-dont-exist.md) sphinx of :[missing](mineral.md)';
  const options = {
    source: path.join(__dirname, '../fixtures/invalid-link/index.md'),
  };

  transcludeString(input, options, err => {
    t.regex(err.message, /ENOENT/);
    t.regex(err.path, /fixtures\/invalid-link\/i-dont-exist.md/);
    t.end();
  });
});
