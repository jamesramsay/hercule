import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import got from 'got';
import { isReadable } from 'isstream';
import through2 from 'through2';

import { grammar } from './grammar';

export function resolveHttpUrl(url) {
  // TODO: handle relative link in
  const isHttpUrl = /https?:\/\//;
  if (!isHttpUrl.test(url)) return null;

  const content = got.stream(url);

  // Manually trigger error since 2XX respsonse doesn't trigger error despite not having expected content
  content.on('response', function error(res) {
    if (res.statusCode !== 200) this.emit('error', { message: 'Could not read file', path: url });
  });

  return { content, url };
}

export function resolveLocalUrl(url, sourcePath) {
  const isLocalUrl = /^[^ ()"']+/;
  if (!isLocalUrl.test(url)) return null;

  const relativePath = path.dirname(sourcePath);
  const localUrl = path.join(relativePath, url);

  const content = fs.createReadStream(localUrl, { encoding: 'utf8' });

  return { content, url: localUrl };
}

export function resolveString(input) {
  const isQuotedString = /^["'].*["']$/;
  if (!isQuotedString.test(input)) return null;

  return { content: input.slice(1, -1) };
}

const defaultResolvers = [resolveHttpUrl, resolveLocalUrl, resolveString];

// Resolves link to string or stream
//  - resolvers is an array of synchronus functions that return null, string or stream.
//  - stream requires processing
//  - string assumed fully processed
export function resolveToReadableStream(link, resolvers = defaultResolvers) {
  const { content, url } = _.reduce(resolvers,
    (memo, resolver) => memo || resolver(link.url, link.source),
    null);

  let outputStream;

  if (_.isString(content)) {
    outputStream = through2({ objectMode: true });

    outputStream.push({
      content,
      source: link.source,
      line: link.line,
      column: link.column,
    });
    outputStream.push(null);
  } else if (isReadable(content)) {
    outputStream = content;
  } else {
    throw new Error(`no readable stream or string, resolve '${link.url}'`);
  }

  return { contentStream: outputStream, resolvedUrl: url };
}


function extendWithSource(link, source, line, column) {
  const url = link.url;
  const placeholder = link.placeholder;
  return { url, placeholder, source, line, column: column + link.index };
}

export function parseContent(content, { source, line, column }) {
  const args = grammar.parse(content);

  // Attach source information to all the url to be resolved
  const contentLink = extendWithSource(args.link, source, line, column);
  const scopeReferences = _.map(args.scopeReferences, ref => extendWithSource(ref, source, line, column));
  const descendantReferences = _.map(args.descendantReferences, ref => extendWithSource(ref, source, line, column));

  return { contentLink, scopeReferences, descendantReferences };
}
