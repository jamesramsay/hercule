import _ from 'lodash';
import grammar from './transclude-parser';

// Link detection (including leading whitespace)
const linkRegExp = new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))/gm);
const WHITESPACE_GROUP = 1;
const PLACEHOLDER_GROUP = 2;
const LINK_GROUP = 3;

function getLink(match) {
  const link = {
    href: _.get(match, `[${LINK_GROUP}]`),
  };
  return link;
}

module.exports = {
  linkRegExp,
  WHITESPACE_GROUP,
  PLACEHOLDER_GROUP,
  LINK_GROUP,
  grammar,
  getLink,
};
