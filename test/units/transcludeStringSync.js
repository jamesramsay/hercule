import test from 'ava';

import { transcludeStringSync } from '../../lib/hercule';

const [major, minor] = process.versions.node.split('.');

if (major < 1 && minor < 12) {
  // eslint-disable-next-line ava/no-only-test
  test.only('synchronous support not available < 0.12', (t) => {
    t.pass();
  });
}

test('should transclude with only required arguments', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  const output = transcludeStringSync(input);
  t.deepEqual(output, expected);
});

test('should transclude with optional relativePath argument', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  const output = transcludeStringSync(input, { relativePath: 'test' });
  t.deepEqual(output, expected);
});

test('should throw error with invalid link', (t) => {
  const input = 'Jackdaws love my :[missing](i-dont-exist.md) sphinx of quartz.';
  try {
    transcludeStringSync(input);
    t.fail();
  } catch (ex) {
    t.deepEqual(ex.message, 'Could not transclude input');
  }
});
