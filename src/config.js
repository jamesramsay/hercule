import _ from 'lodash';

export const SUPPORTED_LINK_TYPES = [
  'string',
  'file',
  'http',
];

// Link detection (including leading whitespace)
export const linkRegExp = new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))/gm);
export const MATCH_GROUP = 0;
export const WHITESPACE_GROUP = 1;
export const PLACEHOLDER_GROUP = 2;
export const LINK_GROUP = 3;

export function defaultToken(match, options, whitespace) {
  return {
    content: match[MATCH_GROUP],
    link: { href: _.isFunction(options.linkMatch) ? options.linkMatch(match) : match[LINK_GROUP] },
    indent: _([whitespace, match[WHITESPACE_GROUP]]).filter(_.isString).value().join(''),
    relativePath: options.relativePath,
    references: options.references || [],
    parents: options.parents || [],
  };
}

export function defaultSeparator(match) {
  return {
    content: match,
  };
}
