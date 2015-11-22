var through2 = require('through2');
var _ = require('lodash');

/*

Input: (string)

Output: (object)
- chunk (string, required) - Chunk that is either a match or miss.
- match (RegExp Match, optional) - Only returned if a match is present.

*/

var defaultOptions = {
  match: 'match',
  chunk: 'chunk'
}

module.exports = function(patternIn, options) {
  var opt = _.merge({}, defaultOptions, options);
  var pattern = clonePattern(patternIn);
  var inputBuffer = "";

  function clonePattern(pattern) {
    // Split the pattern into the pattern and the flags.
    var parts = pattern.toString().slice(1).split("/");
    var regex = parts[0];
    var flags = (parts[1] || "g");

    // Make sure the pattern uses the global flag so our exec() will run as expected.
    if (flags.indexOf("g") === -1) {
      flags += "g";
    }

    clonedPattern = new RegExp(regex, flags)
    return(clonedPattern);
  }


  function pushChunk(chunk, match) {
    output = {};
    output[opt.chunk] = chunk;

    if (match) {
      output[opt.match] = match;
    }

    this.push(output);
  }


  function transform(chunk, encoding, cb) {
    var nextOffset = outputChunk = match = null;
    inputBuffer += chunk.toString('utf8');

    while ((match = pattern.exec(inputBuffer)) !== null) {

      // Content prior to match can be returned without transform
      if (match.index !== 0) {
        pushChunk.call(this, inputBuffer.slice(0, match.index));
      }

      // Match within bounds (exclusive): [     xxxxxx   ]
      if (pattern.lastIndex < inputBuffer.length) {
        pushChunk.call(this, match[0], match);

        // Next match must be after this match
        nextOffset = pattern.lastIndex;

      } else {
      // Match within bounds (inclusive): [        xxxxxx]
      // Cannot be processed without inspecting next chunk or reaching end of stream

        // Next match will be the start of this match
        nextOffset = match.index;
      }

      inputBuffer = inputBuffer.slice(nextOffset);
    }

    pattern.lastIndex = 0;
    cb();
  }


  function flush(cb) {
    var match = null;
    var outputChunk = null;

    while ((match = pattern.exec(inputBuffer)) !== null) {

      // Content prior to match can be returned without modification
      if (match.index !== 0) {
        pushChunk.call(this, inputBuffer.slice(0, match.index));
      }

      pushChunk.call(this, match[0], match);

      // Next match must be after this match
      // All content prior to the match can be disposed of
      nextOffset = pattern.lastIndex;
      inputBuffer = inputBuffer.slice(nextOffset);
    }

    // Empty internal buffer and signal the end of the output stream.
    if (inputBuffer !== '') {
      pushChunk.call(this, inputBuffer);
    }
    this.push(null);

    cb();
  }

  return through2.obj(transform, flush);
}
