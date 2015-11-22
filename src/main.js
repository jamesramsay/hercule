#!/usr/bin/env node

// Hercule
// A simple markdown transclusion tool
// Author: james ramsay

// fs = require 'fs'
// path = require 'path'
// async = require 'async'
var dashdash = require('dashdash');
var opts;

// _VERBOSE = false
// _DEBUG = false

var parser = dashdash.createParser({
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

// logger = (message) ->
//   if _VERBOSE then console.error "#{message}"

function main() {
  // var inputStream;
  // var outputStream = process.stdout;
  // var options = {
  //   relativePath: '',
  //   parents: [],
  //   parentRefs: [],
  // };

  if (opts._args.length === 0) {
    // Assume stdio stream
    console.log('hercule: streaming input from stdin');
    // inputStream = process.stdin;
  } else {
    // Read file as stream
    // TODO: implement opening stream from file
    console.log('hercule: reading input from file ' + opts._args[0]);
  }

  console.log('Not yet implemented!');
}

main();
