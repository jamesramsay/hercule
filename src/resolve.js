import path from 'path';
import _ from 'lodash';

import stringInflater from './inflaters/string';
import localInflater from './inflaters/local';
import httpInflater from './inflaters/http';

import { linkGrammar, transcludeGrammar } from './grammar';

export function resolveReferences(primary, fallback, references) {
  const override = _.find(references, { placeholder: primary.link });
  return override || fallback || primary;
}

export function parseTransclude(transclusionLink, relativePath, source, cb) {
  let parsedLink;
  let primary;
  let fallback;
  let parsedReferences;

  try {
    parsedLink = transcludeGrammar.parse(transclusionLink);

    primary = { link: parsedLink.primary, relativePath, source };
    fallback = parsedLink.fallback ? { link: parsedLink.fallback, relativePath, source } : null;
    parsedReferences = _.map(parsedLink.references, ({ placeholder, link }) => (
      { placeholder, link, relativePath, source }
    ));
  } catch (ex) {
    return cb(ex);
  }

  return cb(null, primary, fallback, parsedReferences);
}

/**
* Resolves a link to a readable stream for transclusion.
*
* Arguments:
* - link (string)
* - relativePath (string)
*
* Returns:
* - error (object): If an error is returned stream will emit error and halt transclusion.
*   - message (string): A message explaining the error!
* - input (stream)
* - resolvedLink (string): Used for determining if a circular link exists.
* - resolvedRelativePath (string): Will be provided as the relativePath for any nested transclusion
*
*/
export function resolveLink({ link, relativePath, source }, cb) {
  let input = '';
  let linkType;
  let resolvedLink;
  let resolvedRelativePath;

  try {
    linkType = linkGrammar.parse(link);
  } catch (err) {
    return cb({ err, message: 'Link could not be parsed', path: link });
  }

  if (linkType === 'string') {
    // Use native slice which permits removing the first and last character
    input = stringInflater(link.slice(1, -1), source); // eslint-disable-line lodash/prefer-lodash-method
  }

  if (linkType === 'local') {
    resolvedLink = path.join(relativePath, link);
    resolvedRelativePath = path.dirname(resolvedLink);
    input = localInflater(resolvedLink);
  }
  if (linkType === 'http') {
    resolvedLink = link;
    resolvedRelativePath = link;
    input = httpInflater(resolvedLink);
  }

  return cb(null, input, resolvedLink, resolvedRelativePath);
}
