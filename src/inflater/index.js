import path from 'path';

import stringInflater from './string';
import localInflater from './local';
import httpInflater from './http';

import grammar from '../grammar/inflate-link';

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
export default function resolveLink(link, relativePath, cb) {
  let input = '';
  let linkType;
  let resolvedLink;
  let resolvedRelativePath = relativePath;

  try {
    linkType = grammar.parse(link);
  } catch (err) {
    return cb({ err, message: 'Link could not be parsed', path: link });
  }

  if (linkType === 'string') {
    input = stringInflater(link.slice(1, -1)); // eslint-disable-line lodash/prefer-lodash-method
  }

  if (linkType === 'local') {
    resolvedLink = path.join(relativePath, link);
    resolvedRelativePath = path.dirname(resolvedLink);

    input = localInflater(resolvedLink);
  }
  if (linkType === 'http') {
    resolvedLink = link;

    input = httpInflater(resolvedLink);
  }

  return cb(null, input, resolvedLink, resolvedRelativePath);
}
