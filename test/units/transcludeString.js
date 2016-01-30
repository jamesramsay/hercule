import test from 'ava';

import { transcludeString } from '../../lib/hercule';

test.cb(`should transclude with only required arguments`, (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  transcludeString(input, (output) => {
    t.same(output, expected);
    t.end();
  });
});

test.cb(`should transclude with optional relativePath argument`, (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  transcludeString(input, { relativePath: 'test' }, (output) => {
    t.same(output, expected);
    t.end();
  });
});

test.cb(`should transclude with optional log handler`, (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  const logger = {
    error: () => t.fail(),
    warn: () => t.fail(),
  };
  transcludeString(input, null, logger, (output) => {
    t.same(output, expected);
    t.end();
  });
});
