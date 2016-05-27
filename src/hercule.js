import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';
import _ from 'lodash';

import Transcluder from './transclude-stream';

const SYNC_TIMEOUT = 10000;

export const TranscludeStream = Transcluder;

export function transcludeString(...args) {
  const input = args.shift();
  const cb = args.pop();
  const [options = {}] = args;
  const relativePath = _.get(options, 'relativePath');
  const source = relativePath ? `${options.relativePath}/string` : 'string';

  const transclude = new Transcluder(source, options);
  let outputString = '';
  let sourceMap;
  let cbErr = null;

  transclude
    .on('readable', function read() {
      let content = null;
      while ((content = this.read()) !== null) {
        outputString += content.toString('utf8');
      }
    })
    .on('error', (err) => {
      if (!cbErr) cbErr = err;
    })
    .on('sourcemap', (srcmap) => (sourceMap = srcmap))
    .on('end', () => cb(cbErr, outputString, sourceMap.sources, sourceMap));

  transclude.write(input, 'utf8');
  transclude.end();
}


export function transcludeFile(...args) {
  const input = args.shift();
  const cb = args.pop();
  const [options = {}] = args;
  if (!_.get(options, 'relativePath')) options.relativePath = path.dirname(input);

  const transclude = new Transcluder(input, options);
  const inputStream = fs.createReadStream(input, { encoding: 'utf8' });
  let outputString = '';
  let sourceMap;
  let cbErr = null;

  inputStream.on('error', (err) => cb(err));

  transclude
    .on('readable', function read() {
      let content = null;
      while ((content = this.read()) !== null) {
        outputString += content;
      }
    })
    .on('error', (err) => {
      if (!cbErr) cbErr = err;
    })
    .on('sourcemap', (srcmap) => (sourceMap = srcmap))
    .on('end', () => cb(cbErr, outputString, sourceMap.sources, sourceMap));

  inputStream.pipe(transclude);
}


export function transcludeFileSync(input, options) {
  const syncOptions = { cwd: __dirname, timeout: SYNC_TIMEOUT };
  const syncArgs = [input, '--reporter', 'json-err'];

  _.forEach(options, (optionValue, optionName) => {
    syncArgs.push(`--${optionName}`, `${optionValue}`);
  });

  const result = childProcess.spawnSync('../bin/hercule', syncArgs, syncOptions);
  const outputContent = result.stdout.toString();
  const err = result.stderr.toString();

  if (err) throw new Error('Could not transclude file');

  return outputContent;
}


export function transcludeStringSync(input, options) {
  const syncOptions = { input, cwd: __dirname, timeout: SYNC_TIMEOUT };
  const syncArgs = ['--reporter', 'json-err'];

  _.forEach(options, (optionValue, optionName) => {
    syncArgs.push(`--${optionName}`, `${optionValue}`);
  });

  const result = childProcess.spawnSync('../bin/hercule', syncArgs, syncOptions);
  const outputContent = result.stdout.toString();
  const err = result.stderr.toString();

  if (err) throw new Error('Could not transclude input');

  return outputContent;
}
