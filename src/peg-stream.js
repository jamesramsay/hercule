var through2 = require('through2');
var _ = require('lodash');

/*

Input stream: Object
- expression (string) - Input will be returned un modified if not provided.

Output stream: Object
- expression (object, required)

Input and output properties can be altered by providing options

*/

var defaultOptions = {
  expression: 'expression',
  parsed: 'parsed',
};

module.exports = function pegStream(grammar, options) {
  var opt = _.merge({}, defaultOptions, options);

  function transform(chunk, encoding, cb) {
    var expression = chunk[opt.expression];

    // No expression to parse
    if (!expression) {
      this.push(chunk);
      return cb();
    }

    chunk[opt.parsed] = grammar.parse(expression);
    this.push(chunk);
    return cb();
  }

  return through2.obj(transform);
};
