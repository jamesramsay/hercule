import test from 'ava';
import path from 'path';

import { transcludeString } from '../../src/promises';

test('should transclude with only required arguments', async t => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';

  const { output } = await transcludeString(input);
  t.deepEqual(output, expected);
});

test('should transclude with optional source argument', async t => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';

  const { output } = await transcludeString(input, { source: 'test' });
  t.deepEqual(output, expected);
});

test('returns sourcemap', async t => {
  const input = 'Jackdaws love my :[size link](size.md) sphinx of quartz.';
  const options = {
    source: path.join(__dirname, '../fixtures/local-link/index.md'),
  };
  const expected = 'Jackdaws love my big sphinx of quartz.';

  const { output, sourceMap } = await transcludeString(input, options);
  t.deepEqual(output, expected);
  t.is(sourceMap.sources.length, 2);
});

test('returns error for invalid links', async t => {
  const input =
    'Jackdaws love my :[missing](i-dont-exist.md) sphinx of :[missing](mineral.md)';
  const options = {
    source: path.join(__dirname, '../fixtures/invalid-link/index.md'),
  };

  try {
    await transcludeString(input, options);
  } catch (err) {
    t.regex(err.message, /ENOENT/);
    t.regex(err.path, /fixtures\/invalid-link\/i-dont-exist.md/);
  }
});
