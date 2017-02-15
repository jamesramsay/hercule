import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { resolve as resolveUrl } from 'url';
import got from 'got';
import { isReadable } from 'isstream';
import through2 from 'through2';

export function resolveHttpUrl(linkUrl, sourcePath) {
  const isHttpUrl = /^https?:\/\//;
  let resolvedUrl;

  if (isHttpUrl.test(linkUrl)) {
    resolvedUrl = linkUrl;
  } else if (isHttpUrl.test(sourcePath)) {
    resolvedUrl = resolveUrl(sourcePath, linkUrl);
  } else {
    return null;
  }

  const content = got.stream(resolvedUrl);

  // Manually trigger error since 2XX respsonse doesn't trigger error despite not having expected content
  content.on('response', function error(res) {
    if (res.statusCode !== 200) this.emit('error', { message: 'Could not read file', path: linkUrl });
  });

  return { content, url: resolvedUrl };
}

export function resolveLocalUrl(linkUrl, sourcePath) {
  const isLocalUrl = /^[^ ()"']+/;
  if (!isLocalUrl.test(linkUrl)) return null;

  const relativePath = path.dirname(sourcePath);
  const localUrl = path.join(relativePath, linkUrl);

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
