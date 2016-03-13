import fs from 'fs';
import childProcess from 'child_process';
import _ from 'lodash';

import Transcluder from './transclude-stream';

const SYNC_TIMEOUT = 10000;
const LOG_OMIT = ['name', 'hostname', 'pid', 'time', 'v', 'msg'];
const LOG_LEVELS = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
};

function relog(log, message) {
  const msg = message.msg;
  const level = message.level;
  const body = _.omit(message, LOG_OMIT);

  log[LOG_LEVELS[level]](body, msg);
}

export const TranscludeStream = Transcluder;

export function transcludeString(...args) {
  const input = args.shift();
  const cb = args.pop();
  const [options, log, linkPaths] = args;

  const transclude = new Transcluder(options, log, linkPaths);
  let outputString = '';

  transclude.on('error', (err) => cb(err));

  transclude.on('readable', function read() {
    let content = null;
    while ((content = this.read()) !== null) {
      outputString += content.toString('utf8');
    }
  });

  transclude.on('end', () => cb(null, outputString));

  transclude.write(input, 'utf8');
  transclude.end();
}


export function transcludeFile(...args) {
  const input = args.shift();
  const cb = args.pop();
  const [options, log, linkPaths] = args;

  const transclude = new Transcluder(options, log, linkPaths);
  const inputStream = fs.createReadStream(input, { encoding: 'utf8' });
  let outputString = '';

  inputStream.on('error', (err) => cb(err));

  transclude.on('error', (err) => cb(err));

  transclude.on('readable', function read() {
    let content = null;
    while ((content = this.read()) !== null) {
      outputString += content;
    }
  });

  transclude.on('end', () => cb(null, outputString));

  inputStream.pipe(transclude);
}


export function transcludeFileSync(...args) {
  const input = args.shift();
  const [options, log] = args;

  const syncOptions = { cwd: __dirname, timeout: SYNC_TIMEOUT };
  const syncArgs = [input, '--reporter', 'json-err'];

  _.each(options, (optionValue, optionName) => {
    syncArgs.push(`--${optionName}`, `${optionValue}`);
  });

  const result = childProcess.spawnSync('../bin/hercule', syncArgs, syncOptions);
  const outputContent = result.stdout.toString();
  const outputLogs = result.stderr.toString().split('\n');

  _.compact(outputLogs).map(JSON.parse).forEach((message) => relog(log, message));

  return outputContent;
}


export function transcludeStringSync(...args) {
  const input = args.shift();
  const [options, log] = args;

  const syncOptions = { input, cwd: __dirname, timeout: SYNC_TIMEOUT };
  const syncArgs = ['--reporter', 'json-err'];

  _.each(options, (optionValue, optionName) => {
    syncArgs.push(`--${optionName}`, `${optionValue}`);
  });

  const result = childProcess.spawnSync('../bin/hercule', syncArgs, syncOptions);
  const outputContent = result.stdout.toString();
  const outputLogs = result.stderr.toString().split('\n');

  _.compact(outputLogs).map(JSON.parse).forEach((message) => relog(log, message));

  return outputContent;
}
