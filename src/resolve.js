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

export function parseTransclude(transclusionLink, relativePath, source, { line, column }, cb) {
  let parsedLink;
  let fallback;

  try {
    parsedLink = transcludeGrammar.parse(transclusionLink);
  } catch (ex) {
    return cb(ex);
  }

  const parsedPrimary = parsedLink.primary;
  const parsedFallback = parsedLink.fallback;

  const primary = { link: parsedPrimary.match, relativePath, source, line, column: column + parsedPrimary.index };

  if (parsedFallback) {
    fallback = { link: parsedFallback.match, relativePath, source, line, column: column + parsedFallback.index };
  }

  const parsedReferences = _.map(parsedLink.references, ({ placeholder, link }) => (
    { placeholder, link: link.match, relativePath, source, line, column: column + link.index }
  ));

  return cb(null, primary, fallback, parsedReferences);
}

// FIXME: link.link is stupid!
/**
 * resolveLink() Resolves a link to a readable stream for transclusion.
 *
 * @param {Object} link - Link will be resolved and contents returned as a readable stream
 * @param {string} link.link - Path to the target file relative to the from the source of the link
 * @param {string} link.relativePath - Directory name of the source file where the link originated.
 *   The relative path is not derived from the source to isolate path handling to this function.
 * @param {string} link.source - Absolute path of the source file
 * @param {number} link.line - Location of the of the link in the source file
 * @param {number} link.column - Location of the of the link in the source file
 * @param {resolveLinkCallback} cb - callback
 * @returns {function} cb
 */
export function resolveLink({ link, relativePath, source, line, column }, cb) {
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
    input = stringInflater(link, source, line, column);
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

/**
 * Resolved link callback
 *
 * @callback resolveLinkCallback
 * @param {Object} error - Error object
 * @param {Object} input - Readable stream object which will be processed for transculsion
 * @param {string} absolutePath - Absolute path of the link permits checking for circular dependencies
 * @param {string} dirname - Directory name of the path to the file or equivalent permits handling of relative links
 */
