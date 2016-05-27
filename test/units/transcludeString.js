import test from 'ava';
import path from 'path';

import { transcludeString } from '../../src/hercule';

test.cb('should transclude with only required arguments', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  transcludeString(input, (err, output) => {
    t.deepEqual(err, null);
    t.deepEqual(output, expected);
    t.end();
  });
});

test.cb('should transclude with optional relativePath argument', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  transcludeString(input, { relativePath: 'test' }, (err, output) => {
    t.deepEqual(err, null);
    t.deepEqual(output, expected);
    t.end();
  });
});

test.cb('should return sourceList', (t) => {
  const input = 'Jackdaws love my :[size link](size.md) sphinx of quartz.';
  const options = { relativePath: path.join(__dirname, '../fixtures/local-link') };
  const expected = 'Jackdaws love my big sphinx of quartz.';

  transcludeString(input, options, (err, output, sourceList) => {
    t.deepEqual(err, null);
    t.deepEqual(output, expected);
    t.deepEqual(sourceList.length, 2);
    t.end();
  });
});

test.cb('should return one error if invalid links found', (t) => {
  const input = 'Jackdaws love my :[missing](i-dont-exist.md) sphinx of :[missing](mineral.md)';
  const options = { relativePath: path.join(__dirname, '../fixtures/invalid-link') };
  transcludeString(input, options, (err) => {
    t.regex(err.message, /ENOENT/);
    t.regex(err.path, /fixtures\/invalid-link\/i-dont-exist.md/);
    t.end();
  });
});

test.cb('should return errors when custom tokenizer options used', (t) => {
  const input = '# Title\n<!-- include(test1.apib) -->\nSome content...\n';
  const options = {
    linkRegExp: new RegExp(/(^[\t ]*)?(?:(:\[.*?\]\((.*?)\))|(<!-- include\((.*?)\) -->))/gm),
    linkMatch: (match) => match[3] || match[5],
  };

  transcludeString(input, options, (err) => {
    t.regex(err.message, /ENOENT/);
    t.deepEqual(err.path, 'test1.apib');
    t.end();
  });
});
