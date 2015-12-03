/**
* Hercule
* A simple markdown transclusion tool
* Author: james ramsay
*/

import fs from 'fs';
import path from 'path';
import dashdash from 'dashdash';
import Transcluder from './transclude-stream';
let opts;

const parser = dashdash.createParser({
  options: [
    {
      names: ['help', 'h'],
      type: 'bool',
      help: 'Print this help and exit.',
    },
    {
      names: ['output', 'o'],
      type: 'string',
      help: 'File to output.',
      helpArg: 'FILE',
    },
    {
      names: ['relative', 'r'],
      type: 'string',
      help: 'Relative path. stdin will be parsed relative to this path.',
    },
  ],
});


try {
  opts = parser.parse(process.argv);
} catch (err) {
  console.log('hercule: error: ' + err.message);
  process.exit(1);
}

if (opts.help) {
  console.log('usage: hercule [OPTIONS]\noptions:\n' + parser.help({includeEnv: true}).trimRight());
  process.exit();
}


function main() {
  let transclude;
  let inputStream;
  let outputStream;
  const options = {
    relativePath: '',
    parents: [],
    parentRefs: [],
  };

  if (opts._args.length === 0) {
    // Reading input from stdin
    inputStream = process.stdin;
    options.relativePath = opts.relative;
  } else {
    // Reading input from file
    inputStream = fs.createReadStream(opts._args[0], {encoding: 'utf8'});
    options.relativePath = path.dirname(opts._args[0]);
  }

  if (opts.output) {
    // Writing output to file
    outputStream = fs.createWriteStream(opts.output, {encoding: 'utf8'});
  } else {
    // Writing output to stdout
    outputStream = process.stdout;
  }

  transclude = new Transcluder(options);

  inputStream.pipe(transclude).pipe(outputStream);
}

main();
