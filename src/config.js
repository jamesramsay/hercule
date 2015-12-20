import path from 'path';
import _ from 'lodash';

const APP_NAME = 'hercule';

// Log into the void, so that providing a logger is optional
export const DEFAULT_LOG = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// Link detection (including leading whitespace)
export const LINK_REGEXP = new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))/gm);
export const WHITESPACE_GROUP = 1;
export const PLACEHOLDER_GROUP = 2;
export const LINK_GROUP = 3;

export function getLink(match) {
  const link = {
    href: _.get(match, `[${LINK_GROUP}]`),
  };
  return link;
}

export function nestIndent(match, chunk) {
  return '' + chunk.indent + match[WHITESPACE_GROUP];
}

export const BUNYAN_DEFAULTS = {
  file: {
    name: APP_NAME,
    streams: [{
      path: path.join(process.cwd(), `${APP_NAME}.log`),
    }],
  },
  json: {
    name: APP_NAME,
    streams: [{
      stream: process.stderr,
    }],
  },
};
