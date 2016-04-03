import test from 'ava';
import path from 'path';

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

test.cb('should return one error if circular dependency found', (t) => {
  const input = path.join(__dirname, '../fixtures/circular-references/index.md');
  const options = { relativePath: path.join(__dirname, '../fixtures/circular-references') };
  const expected = 'The quick brown :[fox](fox.md) jumps over the lazy dog.\n';
  transcludeFile(input, options, (err, output) => {
    t.same(err.msg, 'Circular dependency detected');
    t.regex(err.path, /fixtures\/circular-references\/fox.md/);
    t.same(output, expected);
    t.end();
  });
});

test.cb('should return one error if invalid links found', (t) => {
  const input = path.join(__dirname, '../fixtures/invalid-link/index.md');
  const options = { relativePath: path.join(__dirname, '../fixtures/invalid-link') };
  const expected = 'Jackdaws love my :[missing](i-dont-exist.md) sphinx of :[missing](mineral.md)';
  transcludeFile(input, options, (err, output) => {
    t.same(err.msg, 'Could not read file');
    t.regex(err.path, /fixtures\/invalid-link\/i-dont-exist.md/);
    t.same(output, expected);
    t.end();
  });
});

test.cb('should return sourceList', (t) => {
  const input = path.join(__dirname, '../fixtures/local-link/index.md');
  const options = { relativePath: path.join(__dirname, '../fixtures/local-link') };
  const expected = 'Jackdaws love my big sphinx of quartz.\n';

  transcludeFile(input, options, (err, output, sourceList) => {
    t.same(err, null);
    t.same(output, expected);
    t.regex(sourceList[0], /fixtures\/local-link\/size\.md/);
    t.same(sourceList.length, 1);
    t.end();
  });
});

test.cb('should support tokenizer options', (t) => {
  const input = path.join(__dirname, '../fixtures/_aglio/index.md');
  const expected = 'Jackdaws love my\n\nbig\n\nsphinx\n\nof quartz.\n';
  const options = {
    relativePath: path.join(__dirname, '../fixtures/_aglio'),
    linkRegExp: new RegExp(/(^[\t ]*)?(?:(\:\[.*?\]\((.*?)\))|(<!-- include\((.*?)\) -->))/gm),
    linkMatch: (match) => match[3] || match[5],
  };

  transcludeFile(input, options, (err, output) => {
    t.same(err, null);
    t.same(output, expected);
    t.end();
  });
});
