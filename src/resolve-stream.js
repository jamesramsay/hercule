import through2 from 'through2';
import path from 'path';
import _ from 'lodash';

import grammar from './transclude-parser';
import { LINK_TYPES } from './config';

/**
* Input stream: (object)
* - link (object, required)
*   - href (string, required)
* - relativePath (string)
* - references (array, required)
*   - (object)
*     - placeholder (string, required)
*     - href (string, required)
*     - hrefType (enum, required)
*     - source (string)
*     - original (object)
*       - line (integer, required)
*       - column (integer, required)
* - parents (array, required)
*
* Output stream: (object)
* - link (object, required)
*   - href (string)
*   - hrefType (enum)
* - relativePath (string, optional)
* - references (array, required) - References extended with any newly parsed references.
*   - (object) - as above
* - parents (array, required)
*
* Input and output properties can be altered by providing options
*/

function resolve(unresolvedLink, references, relativePath) {
  const primary = unresolvedLink.primary;
  const fallback = unresolvedLink.fallback;
  const override = _.find(references, { placeholder: primary.href });
  const link = _.pick(override || fallback || primary, ['href', 'hrefType']);

  if (!override && link.hrefType === LINK_TYPES.LOCAL) {
    link.href = path.join(relativePath, link.href);
  }

  return link;
}

function parse(rawLink, relativePath) {
  // Parse link body using peg.js grammar
  // This allows complex links with placeholders, fallbacks, and overrides
  const parsedLink = grammar.parse(rawLink);

  // Make references relative
  const parsedReferences = _.map(parsedLink.references, ({ placeholder, href, hrefType }) => {
    const relativeHref = (hrefType === LINK_TYPES.LOCAL) ? path.join(relativePath, href) : href;
    return { placeholder, hrefType, href: relativeHref };
  });

  return { parsedLink, parsedReferences };
}

export default function ResolveStream(sourceFile, sourcePaths = []) {
  function transform(chunk, encoding, cb) {
    const rawLink = _.get(chunk, ['link', 'href']);
    const relativePath = _.get(chunk, 'relativePath') || '';
    const parentRefs = _.get(chunk, 'references') || [];
    let parsedLink;
    let parsedReferences;

    // No link to parse, move along
    if (!rawLink) {
      this.push(chunk);
      return cb();
    }

    try {
      ({ parsedLink, parsedReferences } = parse(rawLink, relativePath));
    } catch (err) {
      this.push(chunk);
      this.emit('error', { msg: 'Link could not be parsed', path: rawLink, error: err });
      return cb();
    }

    const references = _.uniq([...parsedReferences, ...parentRefs]);
    const link = resolve(parsedLink, parentRefs, relativePath);

    // Add the resolved link path to the array of all source paths
    sourcePaths.push(link.href);

    this.push(_.assign(chunk, { link, references }));
    return cb();
  }

  return through2.obj(transform);
}
