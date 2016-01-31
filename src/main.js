/**
* Hercule
* A simple markdown transclusion tool
* Author: james ramsay
*/

import fs from 'fs';
import path from 'path';
import dashdash from 'dashdash';
import bunyan from 'bunyan';
import Transcluder from './transclude-stream';

import { BUNYAN_DEFAULTS } from './config';

let opts;
let log;

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
      names: ['relativePath', 'r'],
      type: 'string',
      help: 'Relative path. stdin will be parsed relative to this path.',
    },
    {
      name: 'reporter',
      type: 'string',
      help: 'Supported reporters include json, json-stderr, tree',
    },
  ],
});


try {
  opts = parser.parse(process.argv);
} catch (err) {
  console.log(`hercule: error: ${err.message}`); // eslint-disable-line
  process.exit(1);
}


if (opts.help) {
  console.log(`usage: hercule [OPTIONS]\noptions:\n${parser.help({includeEnv: true}).trimRight()}`); // eslint-disable-line
  process.exit();
}


function main() {
  let transclude;
  let inputStream;
  let outputStream;
  let bunyanOptions;
  const options = {
    relativePath: '',
    parents: [],
    parentRefs: [],
  };

  bunyanOptions = BUNYAN_DEFAULTS[opts.reporter] || BUNYAN_DEFAULTS.file;
  log = bunyan.createLogger(bunyanOptions);

  if (opts._args.length === 0) {
    // Reading input from stdin
    inputStream = process.stdin;
    options.relativePath = opts.relativePath;
  } else {
    // Reading input from file
    // TODO: handle file error!
    inputStream = fs.createReadStream(opts._args[0], { encoding: 'utf8' });
    options.relativePath = path.dirname(opts._args[0]);
  }

  if (opts.output) {
    // Writing output to file
    outputStream = fs.createWriteStream(opts.output, { encoding: 'utf8' });
  } else {
    // Writing output to stdout
    outputStream = process.stdout;
  }

  transclude = new Transcluder(options, log);

  inputStream.pipe(transclude).pipe(outputStream);
}

main();
