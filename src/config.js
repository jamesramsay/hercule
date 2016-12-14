// Link detection (including leading whitespace)
export const defaultTokenRegExp = new RegExp(/((^[\t ]*)?:\[.*?]\((.*?)\))/gm);
export const MATCH_GROUP = 0;
export const WHITESPACE_GROUP = 2;
export const PLACEHOLDER_GROUP = 1;
export const LINK_GROUP = 3;
