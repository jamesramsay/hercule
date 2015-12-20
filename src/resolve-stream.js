import through2 from 'through2';
import path from 'path';
import _ from 'lodash';

import {DEFAULT_LOG} from './config';

/**
* Input stream: (object)
* - link (object, required)
*   - href (string, required)
* - relativePath (string, optional)
* - references (array, required) - Empty array permitted
*
* Output stream: (object)
* - link (object, required)
*   - href (string)
*   - hrefType (enum)
* - relativePath (string, optional)
*
* Input and output properties can be altered by providing options
*/

const DEFAULT_OPTIONS = {
  input: 'link.href',
  output: 'link',
};


export default function ResolveStream(grammar, options, log = DEFAULT_LOG) {
  const opt = _.merge({}, DEFAULT_OPTIONS, options);


  function resolve(unresolvedLink, references = [], relativePath = '') {
    let link;
    let fallback;
    let override;

    // Default to primary link
    link = unresolvedLink.primary;
    fallback = unresolvedLink.fallback;

    // Overriding reference
    override = _.find(references, {'placeholder': link.href}) || fallback;

    if (override) {
      link = _.pick(override, ['href', 'hrefType']);
    }

    if (link.hrefType === 'file') {
      link.href = path.join(relativePath, link.href);
    }

    return link;
  }


  function transform(chunk, encoding, cb) {
    const rawLink = _.get(chunk, opt.input);
    const relativePath = _.get(chunk, `relativePath`);
    const parentRefs = _.get(chunk, `references`);
    let link;
    let references;

    // No link to parse
    if (!rawLink) {
      this.push(chunk);
      return cb();
    }

    try {
      link = grammar.parse(rawLink);
    } catch (err) {
      log.warn({err, link: rawLink}, `Link could not be parsed`);
      this.push(chunk);
      return cb();
    }

    references = _.unique([...link.references, ...parentRefs], true);
    link = resolve(link, parentRefs, relativePath);

    this.push(_.assign(chunk, {link}, {references}));
    return cb();
  }

  return through2.obj(transform);
}
