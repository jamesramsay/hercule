import test from 'ava';

import { transcludeStringSync } from '../../lib/hercule';

const [major, minor] = process.versions.node.split('.');

if (major < 1 && minor < 12) {
  test.only('synchronous support not available < 0.12', (t) => {
    t.pass();
  });
}

test('should transclude with only required arguments', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  const output = transcludeStringSync(input);
  t.same(output, expected);
});

test('should transclude with optional relativePath argument', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  const output = transcludeStringSync(input, { relativePath: 'test' });
  t.same(output, expected);
});

test('should transclude with optional log handler', (t) => {
  const input = 'Jackdaws love my :[missing](i-dont-exist.md) sphinx of quartz.';
  const expected = 'Jackdaws love my :[missing](i-dont-exist.md) sphinx of quartz.';
  const logger = {
    error: () => t.pass(),
    warn: () => t.pass(),
  };
  const output = transcludeStringSync(input, null, logger);
  t.same(output, expected);
});
