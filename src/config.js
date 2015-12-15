import _ from 'lodash';

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
