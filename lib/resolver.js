const isString = require('lodash/isString');
const fs = require('fs');
const path = require('path');
const got = require('got');
const { isReadable } = require('isstream');
const through2 = require('through2');

function resolveHttpUrl(url) {
  // TODO: handle relative link in
  const isHttpUrl = /^https?:\/\//;
  if (!isHttpUrl.test(url)) return null;

  const content = got.stream(url);

  // Manually trigger error since 2XX respsonse doesn't trigger error despite not having expected content
  content.on('response', function error(res) {
    if (res.statusCode !== 200)
      this.emit('error', { message: 'Could not read file', path: url });
  });

  return { content, url };
}

function resolveLocalUrl(url, sourcePath) {
  const isLocalUrl = /^[^ ()"']+/;
  if (!isLocalUrl.test(url)) return null;

  const relativePath = path.dirname(sourcePath);
  const localUrl = path.join(relativePath, url);

  const content = fs.createReadStream(localUrl, { encoding: 'utf8' });

  return { content, url: localUrl };
}

function resolveString(input) {
  const isQuotedString = /^["'].*["']$/;
  if (!isQuotedString.test(input)) return null;

  return { content: input.slice(1, -1) };
}

const defaultResolvers = [resolveHttpUrl, resolveLocalUrl, resolveString];

// Resolves link to string or stream
//  - resolvers is an array of synchronus functions that return null, string or stream.
//  - stream requires processing
//  - string assumed fully processed
function resolveToReadableStream(
  link,
  resolvers = defaultResolvers,
  placeholder
) {
  const { content, url } = resolvers.reduce(
    (memo, resolver) => memo || resolver(link.url, link.source, placeholder),
    null
  );

  let outputStream;

  if (isString(content)) {
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

module.exports = {
  resolveToReadableStream,
  resolveHttpUrl,
  resolveLocalUrl,
  resolveString,
};
