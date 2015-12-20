import through2 from 'through2';
import _ from 'lodash';

/**
* Input stream: (string)
*
* Output stream: (object)
* - chunk (string, required) - Chunk that is either a match or miss.
* - match (RegExp Match, optional) - Only returned if a match is present.
*/

const DEFAULT_OPTIONS = {
  match: 'match',
  chunk: 'content',
  extend: null,
};

export default function RegexStream(patternIn, options) {
  const opt = _.merge({}, DEFAULT_OPTIONS, options);
  let pattern = null;
  let inputBuffer = '';

  function clonePattern(inputPattern) {
    const parts = inputPattern.toString().slice(1).split('/');
    let clonedPattern = null;
    const regex = parts[0];
    let flags = (parts[1] || 'g');

    // Make sure the pattern uses the global flag so our exec() will run as expected.
    if (flags.indexOf('g') === -1) {
      flags += 'g';
    }

    clonedPattern = new RegExp(regex, flags);
    return clonedPattern;
  }


  function pushChunk(chunk, match) {
    const leaveBehind = _.get(match, opt.leaveBehind);
    let output = _.assign({[opt.chunk]: chunk}, opt.extend);

    if (match) {
      if (leaveBehind) {
        this.push(_.assign({[opt.chunk]: leaveBehind}, opt.extend));

        // Trim what was left behind
        output[opt.chunk] = chunk.slice(chunk.indexOf(leaveBehind) + leaveBehind.length);
      }

      if (typeof opt.match === 'string') {
        output = _(output).assign({[opt.match]: match}).value();
      }

      if (typeof opt.match === 'object') {
        let processedMatch = _.mapValues(opt.match, (value) => {
          if (typeof value === 'string') return _.get(match, value);
          if (typeof value === 'function') return value(match, opt);
          return null;
        });
        output = _(output).assign(processedMatch).value();
      }
    }

    // remove any null attributes
    output = _(output).omit(_.isNull).value();

    this.push(output);
  }


  function tokenize(chunk) {
    const lastChunk = chunk ? false : true;
    let nextOffset = 0;
    let match = null;

    if (chunk) inputBuffer += chunk.toString('utf8');

    while ((match = pattern.exec(inputBuffer)) !== null) {
      // Content prior to match can be returned without transform
      if (match.index !== nextOffset) {
        pushChunk.call(this, inputBuffer.slice(nextOffset, match.index));
      }

      // Match within bounds: [  xxxx  ]
      if (lastChunk || pattern.lastIndex < inputBuffer.length) {
        pushChunk.call(this, match[0], match);

        // Next match must be after this match
        nextOffset = pattern.lastIndex;
      // Match against bounds: [     xxx]
      } else {
        // Next match will be the start of this match
        nextOffset = match.index;
      }
    }
    inputBuffer = inputBuffer.slice(nextOffset);
    pattern.lastIndex = 0;
  }


  function transform(chunk, encoding, cb) {
    tokenize.call(this, chunk);
    return cb();
  }


  function flush(cb) {
    tokenize.call(this);

    // Empty internal buffer and signal the end of the output stream.
    if (inputBuffer !== '') {
      pushChunk.call(this, inputBuffer);
    }

    this.push(null);
    return cb();
  }

  pattern = clonePattern(patternIn);
  return through2.obj(transform, flush);
}
