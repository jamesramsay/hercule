import grammar from '../lib/transclude-parser';

// Link detection (including leading whitespace)
const linkRegExp = new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))/gm);
const WHITESPACE_GROUP = 1;
const PLACEHOLDER_GROUP = 2;
const LINK_GROUP = 3;

module.exports = {
  linkRegExp,
  WHITESPACE_GROUP,
  PLACEHOLDER_GROUP,
  LINK_GROUP,
  grammar,
};
