#!/usr/bin/env node

var Benchmark = require('benchmark');
var fs = require('fs');
var path = require('path');
var getStream = require('get-stream');

var hercule = require('../lib/hercule');

var inputPathRelative = './fixtures/advanced/index.md';
var inputPathAbsolute = path.join(__dirname, inputPathRelative);
var inputString = fs.readFileSync(inputPathAbsolute, { encoding: 'utf8' });

var suite = new Benchmark.Suite();

suite.add('hercule#transcludeFile', {
  defer: true,
  fn: deferred =>
    hercule.transcludeFile(inputPathAbsolute, () => deferred.resolve()),
});

suite.add('hercule#TranscludeStream', {
  defer: true,
  fn: deferred => {
    const inputStream = fs.createReadStream(inputPathAbsolute, {
      encoding: 'utf8',
    });
    const transclude = new hercule.TranscludeStream(inputPathAbsolute);
    inputStream.pipe(transclude);
    getStream(transclude).then(() => deferred.resolve());
  },
});

suite.add('hercule#transcludeString', {
  defer: true,
  fn: deferred =>
    hercule.transcludeString(inputString, { source: inputPathAbsolute }, () =>
      deferred.resolve()
    ),
});

suite.on('cycle', event => {
  process.stdout.write(String(event.target) + '\n');
});

suite.run();
