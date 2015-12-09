import through2 from 'through2';
import _ from 'lodash';

/*

Input stream: Object
- expression (string) - Input will be returned un modified if not provided.

Output stream: Object
- expression (object, required)

Input and output properties can be altered by providing options

*/

const defaultOptions = {
  expression: 'match',
  parsed: 'link',
};

module.exports = function PegStream(grammar, options) {
  const opt = _.merge({}, defaultOptions, options);

  function transform(chunk, encoding, cb) {
    const expression = _.get(chunk, opt.expression);
    let parsed;

    // No expression to parse
    if (!expression) {
      this.push(chunk);
      return cb();
    }

    try {
      parsed = {
        [opt.parsed]: grammar.parse(expression),
      };
    } catch (err) {
      // TODO: store the error to chunk
      // console.log(JSON.stringify({err}));
      parsed = null;
    }

    this.push(_.assign({}, chunk, parsed));
    return cb();
  }

  return through2.obj(transform);
};
