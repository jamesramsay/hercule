import fs from 'fs';
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

module.exports = {
  transcludeString,
  transcludeFile,
};
