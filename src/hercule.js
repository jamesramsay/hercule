import fs from 'fs';
import _ from 'lodash';
import duplexer from 'duplexer3';
import get from 'through2-get';
import getStream from 'get-stream';

import Transclude from './transclude';
import Indent from './indent';
import Trim from './trim';
import Sourcemap from './sourcemap';

export { resolveHttpUrl, resolveLocalUrl, resolveString } from './resolver';

export function TranscludeStream(source = 'input', options) {
  const outputFile = _.get(options, 'outputFile');
  let sourceMap;

  const transclude = new Transclude(source, options);
  const indenter = new Indent();
  const trim = new Trim();
  const sourcemap = new Sourcemap(outputFile);
  const stringify = get('content');

  transclude.on('error', () => transclude.end());
  sourcemap.on('sourcemap', generatedSourceMap => (sourceMap = generatedSourceMap));

  transclude.pipe(trim).pipe(indenter).pipe(sourcemap).pipe(stringify);

  const transcluder = duplexer({ bubbleErrors: false }, transclude, stringify);
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

  transclude.on('sourcemap', srcmap => (sourceMap = srcmap));
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

  transclude.on('sourcemap', srcmap => (sourceMap = srcmap));
  inputStream.on('error', err => cb(err));
  inputStream.pipe(transclude);

  getStream(transclude)
    .then(output => cb(null, output, sourceMap))
    .catch(err => cb(err, err.bufferedData, sourceMap));
}
