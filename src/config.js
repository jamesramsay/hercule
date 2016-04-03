import _ from 'lodash';

export const LINK_TYPES = {
  LOCAL: 'local',
  HTTP: 'http',
  STRING: 'string',
};

// Link detection (including leading whitespace)
export const defaultTokenRegExp = new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))/gm);
export const MATCH_GROUP = 0;
export const WHITESPACE_GROUP = 1;
export const PLACEHOLDER_GROUP = 2;
export const LINK_GROUP = 3;

export function defaultToken(
  match, { linkMatch, relativePath = '', references = [], parents = [] }, whitespace) {
  return {
    content: match[MATCH_GROUP],
    link: {
      href: _.isFunction(linkMatch) ? linkMatch(match) : match[LINK_GROUP],
    },
    indent: _.filter([whitespace, match[WHITESPACE_GROUP]], _.isString).join(''),
    relativePath,
    references,
    parents,
  };
}

export function defaultSeparator(match) {
  return {
    content: match[0],
  };
}
