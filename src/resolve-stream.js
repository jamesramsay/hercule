import _ from 'lodash';
import through2 from 'through2';
import { parseTransclude, resolveReferences } from './resolve';

/**
* Input: (object)
* - link (object)
* - relativePath (string)
* - references (array[Reference])
*   - placeholder (string)
*   - link (string)
*   - relativePath (string)
* - parents (array)
*
* Output: (object)
* - link (string)
* - relativePath (string)
* - references (array[Reference])
* - parents (array)
*
*/

export default function ResolveStream() {
  // eslint-disable-next-line consistent-return
  function transform(chunk, encoding, cb) {
    const transclusionLink = _.get(chunk, 'link');
    const transclusionRelativePath = _.get(chunk, 'relativePath') || '';
    const parentRefs = _.get(chunk, 'references') || [];

    if (!transclusionLink) {
      this.push(chunk);
      return cb();
    }

    // Parses raw transclusion link: primary.link || fallback.link reference.placeholder:reference.link ...
    parseTransclude(transclusionLink, transclusionRelativePath, (err, primary, fallback, parsedReferences) => {
      if (err) {
        this.push(chunk);
        this.emit('error', { message: 'Link could not be parsed', path: transclusionLink, error: err });
        return cb();
      }

      const references = _.uniq([...parsedReferences, ...parentRefs]);

      // References from parent files override primary links, then to fallback if provided and no matching references
      const { link, relativePath } = resolveReferences(primary, fallback, parentRefs);

      this.emit('source', link);
      this.push(_.assign(chunk, { link, relativePath, references }));
      return cb();
    });
  }

  return through2.obj(transform);
}
