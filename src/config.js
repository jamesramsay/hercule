import grammar from '../lib/transclude-parser';

// Link detection (including leading whitespace)
// TODO: Regex changes from RegExp(/(^[\t ]*) to RegExp(/(\n[\t ]*) because of streaming parser
// How does this impact indentation on the first line?
const linkRegExp = new RegExp(/(\n[\t ]*)?(\:\[.*?\]\((.*?)\))/gm);
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
