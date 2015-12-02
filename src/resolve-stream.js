import through2 from 'through2';
import path from 'path';
import _ from 'lodash';

/**
* Input stream: (object)
* - link (object, required)
*   - primary (object, required)
*     - href (string, required)
*     - hrefType (enum, required)
*   - fallback (object)
*     - href (string, required)
*     - hrefType (enum, required)
*   - references (array[object])
*     - placeholder (string, required)
*     - href (string, required)
*     - hrefType (enum, required)
* - relativePath (string, optional)
*
* Output stream: (object)
* - link (object, required)
*   - href (string)
*   - hrefType (enum)
*
* Input and output properties can be altered by providing options
*/

const defaultOptions = {
  input: 'link',
  output: 'link',
  relativePath: 'relativePath',
};

module.exports = function ResolveStream(options) {
  const opt = _.merge({}, defaultOptions, options);

  function resolve(unresolvedLink, parentRefs = [], relativePath = '') {
    let link;
    let fallback;
    let override;

    // Default to primary link
    link = unresolvedLink.primary;
    fallback = unresolvedLink.fallback;

    // Overriding reference
    override = _.find(parentRefs, {'placeholder': link.href}) || fallback;

    if (override) {
      link = _.pick(override, ['href', 'hrefType']);
    }

    if (link.hrefType === 'file') {
      link.href = path.join(relativePath, link.href);
    }

    return link;
  }

  function transform(chunk, encoding, cb) {
    const link = _.get(chunk, opt.input);
    const relativePath = _.get(chunk, opt.relativePath);
    const parentRefs = _.get(chunk, `${opt.input}.references`);
    let output;

    if (!link) {
      this.push(chunk);
      return cb();
    }

    output = resolve(link, chunk.parentRefs, relativePath);

    chunk.parentRefs = _.assign([], chunk.parentRefs, parentRefs);
    this.push(_.assign({}, chunk, {[opt.output]: output}));
    return cb();
  }

  return through2.obj(transform);
};
