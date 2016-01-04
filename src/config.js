import path from 'path';
import _ from 'lodash';

const APP_NAME = 'hercule';

export const SUPPORTED_LINK_TYPES = [
  'string',
  'file',
  'http',
];

// Log into the void, so that providing a logger is optional
export const DEFAULT_LOG = {
  error: () => {},
};

// Link detection (including leading whitespace)
export const LINK_REGEXP = new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))/gm);
export const WHITESPACE_GROUP = 1;
export const PLACEHOLDER_GROUP = 2;
export const LINK_GROUP = 3;


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
      stream: process.stdout,
    }],
  },
  ['json-err']: {
    name: APP_NAME,
    streams: [{
      stream: process.stderr,
    }],
  },
};
