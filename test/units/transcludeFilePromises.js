import test from 'ava';
import path from 'path';

import { transcludeFile } from '../../src/promises';

test('should transclude with only required arguments', async t => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';

  const { output } = await transcludeFile(input);
  t.deepEqual(output, expected);
});

test('should transclude with optional relativePath argument', async t => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';

  const { output } = await transcludeFile(input, { relativePath: 'test' });
  t.deepEqual(output, expected);
});

test("should return error if file doesn't exist", async t => {
  const input = path.join('i-dont-exist.md');

  try {
    await transcludeFile(input);
  } catch (err) {
    t.regex(err.message, /ENOENT/);
    t.is(err.path, 'i-dont-exist.md');
  }
});

test('should return sourceList', async t => {
  const input = path.join(__dirname, '../fixtures/local-link/index.md');
  const expected = 'Jackdaws love my big sphinx of quartz.\n';

  const { output, sourceMap } = await transcludeFile(input);
  t.deepEqual(output, expected);
  t.regex(sourceMap.sources[1], /size\.md/);
  t.is(sourceMap.sources.length, 2);
});
