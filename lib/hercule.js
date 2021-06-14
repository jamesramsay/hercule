const fs = require('fs');
const duplexer = require('duplexer3');
const get = require('through2-get');
const getStream = require('get-stream');

const { Transclude } = require('./transclude');
const { Indent } = require('./indent');
const { Trim } = require('./trim');
const { Sourcemap } = require('./sourcemap');
const {
  resolveHttpUrl,
  resolveLocalUrl,
  resolveString,
} = require('./resolver');

function TranscludeStream(source = 'input', options = {}) {
  const { outputFile } = options;
  let sourceMap;

  const transclude = new Transclude(source, options);
  const indenter = new Indent();
  const trim = new Trim();
  const sourcemap = new Sourcemap(outputFile);
  const stringify = get('content');

  transclude.on('error', () => transclude.end());
  sourcemap.on('sourcemap', generatedSourceMap => {
    sourceMap = generatedSourceMap;
  });

  transclude.pipe(trim).pipe(indenter).pipe(sourcemap).pipe(stringify);

  const transcluder = duplexer({ bubbleErrors: false }, transclude, stringify);
  transcluder.on('end', () => transcluder.emit('sourcemap', sourceMap));

  return transcluder;
}

function transcludeString(input, ...args) {
  const cb = args.pop();
  const [options = {}] = args;
  const source = options.source || 'string';

  const transclude = new TranscludeStream(source, options);
  let sourceMap;

  transclude.on('sourcemap', srcmap => {
    sourceMap = srcmap;
  });
  transclude.write(input, 'utf8');
  transclude.end();

  getStream(transclude)
    .then(output => cb(null, output, sourceMap))
    .catch(err => cb(err, err.bufferedData, sourceMap));
}

function transcludeFile(input, ...args) {
  const cb = args.pop();
  const [options = {}] = args;

  const transclude = new TranscludeStream(input, options);
  const inputStream = fs.createReadStream(input, { encoding: 'utf8' });
  let sourceMap;

  transclude.on('sourcemap', srcmap => {
    sourceMap = srcmap;
  });
  inputStream.on('error', err => cb(err));
  inputStream.pipe(transclude);

  getStream(transclude)
    .then(output => cb(null, output, sourceMap))
    .catch(err => cb(err, err.bufferedData, sourceMap));
}

module.exports = {
  TranscludeStream,
  transcludeFile,
  transcludeString,
  resolveHttpUrl,
  resolveLocalUrl,
  resolveString,
};
