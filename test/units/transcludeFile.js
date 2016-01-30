import test from 'ava';
import path from 'path';

import { transcludeFile } from '../../lib/hercule';

test.cb(`should transclude with only required arguments`, (t) => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';
  transcludeFile(input, (output) => {
    t.same(output, expected);
    t.end();
  });
});

test.cb(`should transclude with optional relativePath argument`, (t) => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';
  transcludeFile(input, { relativePath: 'test' }, (output) => {
    t.same(output, expected);
    t.end();
  });
});

test.cb(`should transclude with optional log handler`, (t) => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';
  const logger = {
    error: () => t.fail(),
    warn: () => t.fail(),
  };
  transcludeFile(input, null, logger, (output) => {
    t.same(output, expected);
    t.end();
  });
});
