import _ from 'lodash';

// Link detection (including leading whitespace)
export const defaultTokenRegExp = new RegExp(/(^[\t ]*)?(:\[.*?\]\((.*?)\))/gm);
export const MATCH_GROUP = 0;
export const WHITESPACE_GROUP = 1;
export const PLACEHOLDER_GROUP = 2;
export const LINK_GROUP = 3;

export function defaultToken(
  match, { linkMatch, relativePath = '', references = [], parents = [], source = '' }, whitespace) {
  return {
    content: match[MATCH_GROUP],
    link: _.isFunction(linkMatch) ? linkMatch(match) : match[LINK_GROUP],
    indent: _.filter([whitespace, match[WHITESPACE_GROUP]], _.isString).join(''),
    relativePath,
    references,
    parents,
    source,
  };
}

export function defaultSeparator(match, { indent = '', source = '' }) {
  return {
    indent,
    content: match[MATCH_GROUP],
    source,
  };
}
