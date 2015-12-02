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
      names: ['verbose', 'v'],
      type: 'arrayOfBool',
      help: 'Verbose output. Use multiple times for more verbose.',
    },
    {
      names: ['output', 'o'],
      type: 'string',
      help: 'File to output',
      helpArg: 'FILE',
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
    console.log('hercule: streaming input from stdin');
    inputStream = process.stdin;
  } else {
    inputStream = fs.createReadStream(opts._args[0], {encoding: 'utf8'});
    options.relativePath = path.dirname(opts._args[0]);
    console.log(`hercule: reading input from file ${opts._args[0]}`);
  }

  if (opts.output) {
    outputStream = fs.createWriteStream(opts.output, {encoding: 'utf8'});
    console.log(`hercule: writing output to file ${opts.output}`);
  } else {
    outputStream = process.stdout;
  }

  transclude = new Transcluder(options);

  inputStream.pipe(transclude).pipe(outputStream);
}

main();
