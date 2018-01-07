import test from 'ava';
import path from 'path';

import { transcludeFile } from '../../src/hercule';

test.cb('should transclude with only required arguments', t => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';
  transcludeFile(input, (err, output) => {
    t.deepEqual(err, null);
    t.deepEqual(output, expected);
    t.end();
  });
});

test.cb('should transclude with optional relativePath argument', t => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';
  transcludeFile(input, { relativePath: 'test' }, (err, output) => {
    t.deepEqual(err, null);
    t.deepEqual(output, expected);
    t.end();
  });
});

test.cb("should return error if file doesn't exist", t => {
  const input = path.join('i-dont-exist.md');
  transcludeFile(input, err => {
    t.regex(err.message, /ENOENT/);
    t.deepEqual(err.path, 'i-dont-exist.md');
    t.end();
  });
});

test.cb('should return one error if circular dependency found', t => {
  const input = path.join(
    __dirname,
    '../fixtures/circular-references/index.md'
  );
  const options = {
    relativePath: path.join(__dirname, '../fixtures/circular-references'),
  };
  transcludeFile(input, options, err => {
    t.deepEqual(err.message, 'Circular dependency detected');
    t.regex(err.path, /fox.md/);
    t.end();
  });
});

test.cb('should return one error if invalid links found', t => {
  const input = path.join(__dirname, '../fixtures/local-link-ENOENT/index.md');
  transcludeFile(input, err => {
    t.regex(err.message, /ENOENT/);
    t.regex(err.path, /i-dont-exist.md/);
    t.end();
  });
});

test.cb('should return sourceList', t => {
  const input = path.join(__dirname, '../fixtures/local-link/index.md');
  const expected = 'Jackdaws love my big sphinx of quartz.\n';

  transcludeFile(input, (err, output, sourcemap) => {
    t.deepEqual(err, null);
    t.deepEqual(output, expected);
    t.regex(sourcemap.sources[1], /size\.md/);
    t.deepEqual(sourcemap.sources.length, 2);
    t.end();
  });
});
