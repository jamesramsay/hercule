import through2 from 'through2';
import path from 'path';
import _ from 'lodash';

/**
* Input stream: (object)
* - link (object, required)
*   - href (string, required)
* - relativePath (string, optional)
*
* Output stream: (object)
* - link (object, required)
*   - href (string)
*   - hrefType (enum)
* - relativePath (string, optional)
*
* Input and output properties can be altered by providing options
*/

const defaultOptions = {
  input: 'link',
  output: 'link',
};

module.exports = function ResolveStream(grammar, options) {
  const opt = _.merge({}, defaultOptions, options);


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
      link = grammar.parse(rawLink.href);
    } catch (err) {
      // TODO: store the error to chunk
      // console.log(JSON.stringify({err}));
      link = null;
    }

    if (link) {
      references = _.assign([], parentRefs, link.references);
      link = resolve(link, parentRefs, relativePath);
    }

    this.push(_.assign({}, chunk, {link}, {references}));
    return cb();
  }

  return through2.obj(transform);
};
