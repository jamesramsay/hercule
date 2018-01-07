import {
  resolveLocalUrl,
  resolveString,
  TranscludeStream as TranscludeStreamInternal,
  transcludeString as transcludeStringInternal,
  transcludeFile as transcludeFileInternal
} from 'hercule';
import resolveHttpUrl from 'hercule-resolve-http-url';

const resolvers = [resolveHttpUrl, resolveLocalUrl, resolveString];

function fixOptions(options) {
  if (Array.isArray(options.resolvers)) {
    return options;
  }

  return Object.assign({}, options, { resolvers });
}

export function TranscludeStream(source = 'input', options) {
  return TranscludeStreamInternal(source, fixOptions(options));
}

export function transcludeString(input, ...args) {
  const cb = args.pop();
  const [options = {}] = args;

  return transcludeStringInternal(input, fixOptions(options), cb);
}

export function transcludeFile(input, ...args) {
  const cb = args.pop();
  const [options = {}] = args;

  return transcludeFileInternal(input, fixOptions(options), cb);
}

export { resolveHttpUrl, resolveLocalUrl, resolveString };
