var through2 = require('through2');

// TODO: Add flags to enable handle regular expressions which can mach one character width ( /\w+/)
// TODO: Add flags to enable handle regular expressions which have a defined end (/\(w+\)/)
// TODO: Add flags to enable handle return un-transformed text

function RegexStream(patternIn) {

  // TODO: Validate that the RegExp is a unique instance (clone)
  var pattern = clonePattern(patternIn);
  var inputBuffer = "";

  return(through2.obj(transform, flush));


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


  function transform(chunk, encoding, cb) {
    inputBuffer += chunk.toString('utf8');

    var nextOffset = null;
    var match = null;

    while ((match = pattern.exec(inputBuffer)) !== null) {

      // Content prior to match can be returned without transform
      if (match.index !== 0) {
        this.push({
          tokenType: 'miss',
          content: inputBuffer.slice(0, match.index)
        });
      }

      // Match within bounds (exclusive): [     xxxxxx   ]
      if (pattern.lastIndex < inputBuffer.length) {

        this.push({
          tokenType: 'match',
          content: match[0]
        })

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

    while ((match = pattern.exec(inputBuffer)) !== null) {

      // Content prior to match can be returned without modification
      if (match.index !== 0) {
        this.push({
          tokenType: 'miss',
          content: inputBuffer.slice(0, match.index)
        });
      }

      this.push({
        tokenType: 'match',
        content: match[0]
      });

      // Next match must be after this match
      nextOffset = pattern.lastIndex;

      // All content prior to the match can be disposed of
      inputBuffer = inputBuffer.slice(nextOffset);
    }

    // Empty internal buffer and signal the end of the output stream.
    if (inputBuffer !== '') {
      this.push({
        tokenType: 'miss',
        content: inputBuffer
      });
    }
    this.push(null);

    cb();
  }
}

module.exports = RegexStream;
