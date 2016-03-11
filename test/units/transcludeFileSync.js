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
  t.same(output, expected);
});

test('should transclude with optional relativePath argument', (t) => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';
  const output = transcludeFileSync(input, { relativePath: 'test' });
  t.same(output, expected);
});

test('should transclude with optional log handler', (t) => {
  const input = path.join(__dirname, '../fixtures/invalid-link/index.md');
  const expected = 'Jackdaws love my :[missing](i-dont-exist.md) sphinx of quartz.\n';
  const logger = {
    error: () => t.pass(),
    warn: () => t.pass(),
  };
  const output = transcludeFileSync(input, null, logger);
  t.same(output, expected);
});
