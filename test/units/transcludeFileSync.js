import test from 'ava';
import path from 'path';

import { transcludeFileSync } from '../../lib/hercule';

const [major, minor] = process.versions.node.split('.');

if (major < 1 && minor < 12) {
  // eslint-disable-next-line ava/no-only-test
  test.only('synchronous support not available < 0.12', (t) => {
    t.pass();
  });
}

test('should transclude with only required arguments', (t) => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';
  const output = transcludeFileSync(input);
  t.deepEqual(output, expected);
});

test('should transclude with optional relativePath argument', (t) => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';
  const output = transcludeFileSync(input, { relativePath: 'test' });
  t.deepEqual(output, expected);
});

test('should throw error with invalid link', (t) => {
  const input = path.join(__dirname, '../fixtures/invalid-link/index.md');
  try {
    transcludeFileSync(input);
    t.fail();
  } catch (ex) {
    t.deepEqual(ex.message, 'Could not read file');
  }
});
