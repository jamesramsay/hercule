import through2 from 'through2';
import path from 'path';
import _ from 'lodash';

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


export default function ResolveStream(grammar, opt, linkPaths = []) {
  const options = _.merge({}, DEFAULT_OPTIONS, opt);


  function resolve(unresolvedLink, references, relativePath) {
    let link = unresolvedLink.primary;
    const fallback = unresolvedLink.fallback;
    const override = _.find(references, { placeholder: link.href });

    if (override || fallback) {
      link = _.pick(override || fallback, ['href', 'hrefType']);
    }

    if (!override && link.hrefType === 'file') {
      link.href = path.join(relativePath, link.href);
    }

    return link;
  }


  function transform(chunk, encoding, cb) {
    const rawLink = _.get(chunk, options.input);
    const relativePath = _.get(chunk, 'relativePath') || '';
    const parentRefs = _.get(chunk, 'references') || [];
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
      this.push(chunk);
      this.emit('error', {
        msg: 'Link could not be parsed',
        path: rawLink,
        error: err,
      });
      return cb();
    }

    references = _.map(link.references, ({ placeholder, href, hrefType }) => {
      let relativeHref = href;
      if (hrefType === 'file') relativeHref = path.join(relativePath, href);
      return { placeholder, hrefType, href: relativeHref };
    });

    references = _.uniq([...references, ...parentRefs], true);
    link = resolve(link, parentRefs, relativePath);

    linkPaths.push(link.href);

    this.push(_.assign(chunk, { [options.output]: link }, { references }));
    return cb();
  }

  return through2.obj(transform);
}
