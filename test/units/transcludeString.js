import test from 'ava';
import _ from 'lodash';

import { transcludeString } from '../../lib/hercule';

test.cb('should transclude with only required arguments', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  transcludeString(input, (err, output) => {
    t.same(err, null);
    t.same(output, expected);
    t.end();
  });
});

test.cb('should transclude with optional relativePath argument', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  transcludeString(input, { relativePath: 'test' }, (err, output) => {
    t.same(err, null);
    t.same(output, expected);
    t.end();
  });
});

test.cb('should provide pathList if variable provided', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  const pathList = [];

  transcludeString(input, null, pathList, (err, output) => {
    t.same(err, null);
    t.same(output, expected);
    t.same(pathList.length, 0);
    t.end();
  });
});

test.cb('should support tokenizer options', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.';
  const expected = 'The quick brown fox jumps over the lazy dog.';
  const options = {
    linkRegExp: new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))|()( *<!-- include\((.*)\) -->)/gm),
    linkMatch: (match) => _.get(match, '[3]') || _.get(match, '[6]'),
  };

  transcludeString(input, options, (err, output) => {
    t.same(err, null);
    t.same(output, expected);
    t.end();
  });
});
