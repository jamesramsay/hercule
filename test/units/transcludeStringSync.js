import test from 'ava';
import sinon from 'sinon';

import { transcludeStringSync } from '../../src/hercule';

global.childProcess = require('child_process');

test.before(() => {
  const stub = sinon.stub(global.childProcess, 'spawnSync');
  stub.withArgs('../bin/hercule', ['--reporter', 'json-err'])
    .returns({ stdout: 'The quick brown fox jumps over the lazy dog.\n', stderr: '' });

  stub.withArgs('../bin/hercule', ['--reporter', 'json-err', '--relativePath', 'test'])
    .returns({ stdout: 'Jackdaws love my big sphinx of quartz.\n', stderr: '' });

  stub.withArgs('../bin/hercule', ['--reporter', 'json-err', '--relativePath', 'error'])
    .returns({ stdout: '', stderr: 'ERROR' });
});

test.after(() => {
  global.childProcess.spawnSync.restore();
});

test('should transclude with only required arguments', (t) => {
  const input = 'The quick brown fox jumps over the lazy dog.\n';
  const output = transcludeStringSync(input);
  t.deepEqual(output, input);
});

test('should transclude with optional relativePath argument', (t) => {
  const input = 'Jackdaws love my big sphinx of quartz.\n';
  const output = transcludeStringSync(input, { relativePath: 'test' });
  t.deepEqual(output, input);
});

test('should throw error with invalid link', (t) => {
  const input = 'Jackdaws love my :[missing](i-dont-exist.md) sphinx of quartz.';
  try {
    transcludeStringSync(input, { relativePath: 'error' });
    t.fail();
  } catch (ex) {
    t.deepEqual(ex.message, 'Could not transclude input');
  }
});
