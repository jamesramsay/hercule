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


function relog(log, level, body, message) {
  log[LOG_LEVELS[level]](body, message);
}

export const TranscludeStream = Transcluder;

export function transcludeString(...args) {
  const input = args.shift();
  const cb = args.pop();
  const [options, log] = args;

  const transclude = new Transcluder(options, log);
  let outputString = '';

  transclude.on('readable', function read() {
    let content = null;
    while ((content = this.read()) !== null) {
      outputString += content.toString('utf8');
    }
  });

  transclude.on('end', function end() {
    return cb(outputString);
  });

  transclude.write(input, 'utf8');
  transclude.end();
}


export function transcludeFile(...args) {
  const input = args.shift();
  const cb = args.pop();
  const [options, log] = args;

  const transclude = new Transcluder(options, log);
  const inputStream = fs.createReadStream(input, { encoding: 'utf8' });
  let outputString = '';

  transclude.on('readable', function read() {
    let content = null;
    while ((content = this.read()) !== null) {
      outputString += content;
    }
  });

  transclude.on('end', function end() {
    return cb(outputString);
  });

  inputStream.pipe(transclude);
}


export function transcludeFileSync(input, { relativePath }, log) {
  const options = {
    cwd: __dirname,
    timeout: SYNC_TIMEOUT,
  };
  const args = [input, '--reporter', 'json-err'];
  const result = childProcess.spawnSync('../bin/hercule', args, options);
  const outputContent = result.stdout.toString();
  const outputLogs = result.stderr.toString().split('\n');

  _.compact(outputLogs).map(JSON.parse).forEach((message) => {
    const msg = message.msg;
    const level = message.level;
    const body = _.omit(message, LOG_OMIT);
    relog(log, level, body, msg);
  });

  return outputContent;
}


export function transcludeStringSync(input, { relativePath }, log) {
  const options = {
    input,
    cwd: __dirname,
    timeout: SYNC_TIMEOUT,
  };
  const args = ['--relative', relativePath, '--reporter', 'json-err'];
  const result = childProcess.spawnSync('../bin/hercule', args, options);
  const outputContent = result.stdout.toString();
  const outputLogs = result.stderr.toString().split('\n');

  _.compact(outputLogs).map(JSON.parse).forEach((message) => {
    const msg = message.msg;
    const level = message.level;
    const body = _.omit(message, LOG_OMIT);
    relog(log, level, body, msg);
  });

  return outputContent;
}
