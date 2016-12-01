import _ from 'lodash';

// Link detection (including leading whitespace)
export const defaultTokenRegExp = new RegExp(/((^[\t ]*)?:\[.*?]\((.*?)\))/gm);
export const MATCH_GROUP = 0;
export const WHITESPACE_GROUP = 2;
export const PLACEHOLDER_GROUP = 1;
export const LINK_GROUP = 3;

export function defaultToken(
  match, { linkMatch, source = '', references = [], parents = [] }, whitespace) {
  return {
    content: match[MATCH_GROUP],
    link: _.isFunction(linkMatch) ? linkMatch(match) : match[LINK_GROUP],
    indent: _.filter([whitespace, match[WHITESPACE_GROUP]], _.isString).join(''),
    references,
    parents,
    source,
  };
}

export function defaultSeparator(match, { indent = '', source = '', parents }) {
  return {
    indent,
    content: match[MATCH_GROUP],
    source,
    parents,
  };
}
