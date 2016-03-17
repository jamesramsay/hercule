import test from 'ava';
import path from 'path';
import _ from 'lodash';

import { transcludeFile } from '../../lib/hercule';

test.cb('should transclude with only required arguments', (t) => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';
  transcludeFile(input, (err, output) => {
    t.same(err, null);
    t.same(output, expected);
    t.end();
  });
});

test.cb('should transclude with optional relativePath argument', (t) => {
  const input = path.join(__dirname, '../fixtures/no-link/index.md');
  const expected = 'The quick brown fox jumps over the lazy dog.\n';
  transcludeFile(input, { relativePath: 'test' }, (err, output) => {
    t.same(err, null);
    t.same(output, expected);
    t.end();
  });
});

test.cb('should return error if file doesn\'t exist', (t) => {
  const input = path.join('i-dont-exist.md');
  transcludeFile(input, (err, output) => {
    t.ok(err);
    // t.same(err.msg, 'TODO');
    t.same(err.path, 'i-dont-exist.md');
    t.notOk(output);
    t.end();
  });
});

// test.cb('should return error if circular dependency found', (t) => {
//   const input = path.join(__dirname, '../fixtures/circular-references/index.md');
//   const options = { relativePath: path.join(__dirname, '../fixtures/circular-references') };
//   transcludeFile(input, options, (err, output) => {
//     t.ok(err);
//     t.same(err.msg, 'Circular dependency detected');
//     t.regex(err.path, /fixtures\/circular-references\/fox.md/);
//     t.notOk(output);
//     t.end();
//   });
// });

test.cb('should provide pathList if variable provided', (t) => {
  const input = path.join(__dirname, '../fixtures/local-link/index.md');
  const options = { relativePath: path.join(__dirname, '../fixtures/local-link') };
  const expected = 'Jackdaws love my big sphinx of quartz.\n';
  const pathList = [];

  transcludeFile(input, options, pathList, (err, output) => {
    t.same(err, null);
    t.same(output, expected);
    t.regex(pathList[0], /fixtures\/local-link\/size\.md/);
    t.same(pathList.length, 1);
    t.end();
  });
});

test.cb('should support tokenizer options', (t) => {
  const input = path.join(__dirname, '../fixtures/_aglio/index.md');
  const expected = 'Jackdaws love my\n\nbig\n\nsphinx\n\nof quartz.\n';
  const options = {
    relativePath: path.join(__dirname, '../fixtures/_aglio'),
    linkRegExp: new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))|()( *<!-- include\((.*)\) -->)/gm),
    linkMatch: (match) => _.get(match, '[3]') || _.get(match, '[6]'),
  };

  transcludeFile(input, options, (err, output) => {
    t.same(err, null);
    t.same(output, expected);
    t.end();
  });
});
