import fs from 'fs';
import _ from 'lodash';
import duplexer from 'duplexer3';
import get from 'through2-get';
import getStream from 'get-stream';

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
  let sourceMap;
  let cbErr = null;

  transclude
    .on('sourcemap', srcmap => (sourceMap = srcmap))
    .on('error', (err) => {
      if (!cbErr) cbErr = err; // TODO: fix stream emitting multiple errors
    });

  transclude.write(input, 'utf8');
  transclude.end();

  getStream(transclude)
    .then(output => cb(null, output, sourceMap))
    .catch(err => cb(err, err.bufferedData, sourceMap));
}


export function transcludeFile(...args) {
  const input = args.shift();
  const cb = args.pop();
  const [options = {}] = args;

  const transclude = new TranscludeStream(input, options);
  const inputStream = fs.createReadStream(input, { encoding: 'utf8' });
  let sourceMap;
  let cbErr = null;

  inputStream.on('error', err => cb(err));
  transclude
    .on('sourcemap', srcmap => (sourceMap = srcmap))
    .on('error', (err) => {
      if (!cbErr) cbErr = err; // TODO: fix stream emitting multiple errors
    });

  inputStream.pipe(transclude);

  getStream(transclude)
    .then(output => cb(null, output, sourceMap))
    .catch(err => cb(err, err.bufferedData, sourceMap));
}
