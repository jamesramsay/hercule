import fs from 'fs';
import _ from 'lodash';
import duplexer from 'duplexer3';
import get from 'through2-get';

import Transclude from './transclude';
import Indent from './indent';
import Trim from './trim';
import Sourcemap from './sourcemap';

export function TranscludeStream(source = 'input', options) {
  const outputFile = _.get(options, 'outputFile');
  let sourceMap;

  const transclude = new Transclude(source);
  const indenter = new Indent();
  const trim = new Trim();
  const sourcemap = new Sourcemap(outputFile);
  const stringify = get('content');

  transclude
    .pipe(trim)
    .pipe(indenter)
    .pipe(sourcemap)
    .pipe(stringify);

  const transcluder = duplexer(transclude, stringify);

  transclude.on('error', (err) => {
    transcluder.emit('error', err);
    transclude.end();
  });

  sourcemap.on('sourcemap', (generatedSourceMap) => {
    sourceMap = generatedSourceMap;
  });

  transcluder.on('end', () => transcluder.emit('sourcemap', sourceMap));

  return transcluder;
}

export function transcludeString(...args) {
  const input = args.shift();
  const cb = args.pop();
  const [options = {}] = args;
  const source = _.get(options, 'source') || 'string';

  const transclude = new TranscludeStream(source, options);
  let outputString = '';
  let sourceMap;
  let cbErr = null;

  transclude
    .on('readable', function read() {
      let content = null;
      while ((content = this.read()) !== null) {
        outputString += content.toString('utf8');
      }
    })
    .on('error', (err) => {
      if (!cbErr) cbErr = err;
    })
    .on('sourcemap', srcmap => (sourceMap = srcmap))
    .on('end', () => cb(cbErr, outputString, sourceMap));

  transclude.write(input, 'utf8');
  transclude.end();
}


export function transcludeFile(...args) {
  const input = args.shift();
  const cb = args.pop();
  const [options = {}] = args;

  const transclude = new TranscludeStream(input, options);
  const inputStream = fs.createReadStream(input, { encoding: 'utf8' });
  let outputString = '';
  let sourceMap;
  let cbErr = null;

  inputStream.on('error', err => cb(err));

  transclude
    .on('readable', function read() {
      let content = null;
      while ((content = this.read()) !== null) {
        outputString += content;
      }
    })
    .on('error', (err) => {
      if (!cbErr) cbErr = err;
    })
    .on('sourcemap', srcmap => (sourceMap = srcmap))
    .on('end', () => cb(cbErr, outputString, sourceMap));

  inputStream.pipe(transclude);
}
