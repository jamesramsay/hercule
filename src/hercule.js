import fs from 'fs';
import childProcess from 'child_process';

import Transcluder from './transclude-stream';


function transcludeString(input, options, callback) {
  const transclude = new Transcluder(options);
  let outputString = '';

  transclude.on('readable', function read() {
    let content = null;
    while ((content = this.read()) !== null) {
      outputString += content.toString('utf8');
    }
  });

  transclude.on('end', function end() {
    callback(outputString);
  });

  transclude.write(input, 'utf8');
  transclude.end();
}


function transcludeFile(input, options, callback) {
  const transclude = new Transcluder(options);
  const inputStream = fs.createReadStream(input, {encoding: 'utf8'});
  let outputString = '';

  transclude.on('readable', function read() {
    let content = null;
    while ((content = this.read()) !== null) {
      outputString += content;
    }
  });

  transclude.on('end', function end() {
    return callback(outputString);
  });

  inputStream.pipe(transclude);
}


function transcludeFileSync(input) {
  const options = {
    cwd: __dirname,
  };
  return childProcess.execFileSync('../bin/hercule', [input], options).toString();
}


function transcludeStringSync(input, {relativePath}) {
  const options = {
    cwd: __dirname,
    input: input,
  };
  const args = [
    '--relative',
    relativePath,
  ];
  return childProcess.execFileSync('../bin/hercule', args, options).toString();
}


module.exports = {
  transcludeString,
  transcludeFile,
  transcludeFileSync,
  transcludeStringSync,
};
