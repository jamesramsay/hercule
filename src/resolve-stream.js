var through2 = require('through2');
var path = require('path');
var _ = require('lodash');

/*

Input stream: Object
- link (object, required)
  - primary (object, required)
    - href (string, required)
    - hrefType (enum, required)
  - fallback (object)
    - href (string, required)
    - hrefType (enum, required)
  - references (array[object])
    - placeholder (string, required)
    - href (string, required)
    - hrefType (enum, required)
- relativePath (string, optional)

Output stream: Object
- link (object, required)
  - href (string)
  - hrefType (enum)

Input and output properties can be altered by providing options

*/

var defaultOptions = {
  input: 'link',
  output: 'link',
  relativePath: 'relativePath'
}

module.exports = function(options) {
  var opt = _.merge({}, defaultOptions, options);

  function transform(chunk, encoding, cb) {
    var link = chunk[opt.input];

    if (!link) {
      this.push(chunk);
      return cb();
    }

    // Default to primary link
    var outputLink = link.primary;

    // Overriding references
    var overridingReference = _.find(link.references, {'placeholder': outputLink.href});

    // Fallback reference
    var fallbackReference = link.fallback ? link.fallback : null;

    if (overridingReference || fallbackReference) {
      outputLink = _.pick(overridingReference || fallbackReference, ['href', 'hrefType']);
    }

    // Relative path
    if (chunk[opt.relativePath] && outputLink.hrefType === 'file') {
      outputLink.href = path.join(chunk[opt.relativePath], outputLink.href);
    }

    chunk[opt.output] = outputLink;
    this.push(chunk);
    return cb();
  }

  return through2.obj(transform);
}
