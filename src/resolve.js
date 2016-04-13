import _ from 'lodash';
import grammar from './grammar/transclusion-link';

export function resolveReferences(primary, fallback, references) {
  const override = _.find(references, { placeholder: primary.link });
  return override || fallback || primary;
}

export function parseTransclude(transclusionLink, relativePath, cb) {
  let parsedLink;
  let primary;
  let fallback;
  let parsedReferences;

  try {
    parsedLink = grammar.parse(transclusionLink);

    // Links are relative to their source
    parsedReferences = _.map(parsedLink.references, ({ placeholder, link }) => ({ placeholder, link, relativePath }));
    primary = parsedLink.primary ? { link: parsedLink.primary, relativePath } : null;
    fallback = parsedLink.fallback ? { link: parsedLink.fallback, relativePath } : null;
  } catch (ex) {
    return cb(ex);
  }

  return cb(null, primary, fallback, parsedReferences);
}
