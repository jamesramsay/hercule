var through2 = require( "through2" );

// TODO: Add flags to enable handling of:
//  - regular expressions which can mach one character width ( /\w+/) (FALSE)
//  - regular expressions which have a defined end (/\(w+\)/) (FALSE)
//  - return un-transformed text (TRUE)

function RegExStream(patternIn) {

  // Each instance of the stream requires a unique instance of the regular expression
  // if (!(patternIn instanceof RegExp)) {
  //   patternIn = new RegExp(patternIn, "g");
  // }
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
    inputBuffer += chunk.toString( "utf8" );

    // Prevent the buffer from growing unnecessarily large by tracking the last relevant index.
    // Content before this index can be discarded.
    var nextOffset = null;
    var match = null;

    while ((match = pattern.exec(inputBuffer)) !== null) {

      // Content prior to match can be returned without transform
      this.push(inputBuffer.slice(0, match.index));

      // Match within bounds (exclusive): [     xxxxxx   ]
      if (pattern.lastIndex < inputBuffer.length) {

        // TRANSFORM HERE!
        this.push(match[0])

        // Next match must be after this match
        nextOffset = pattern.lastIndex;

      // Match within bounds (inclusive): [        xxxxxx]
      // Cannot be processed without inspecting next chunk or reaching end of stream
      // NOTE: This will vary based on the specifics of the regular expression
      } else {
        nextOffset = match.index;
      }

      // All content prior to the match can be disposed of
      inputBuffer = inputBuffer.slice(nextOffset);
    }

    // If no match was found at all, then we can reset the internal buffer entirely.
    // TODO: THIS ASSUMPTION MAY NOT HOLD FOR ALL REGEXP!
    // if ( nextOffset == null ) {
    //   inputBuffer = "";
    // }

    // Reset the regular expression so that it can pick up at the start of the
    // internal buffer when the next chunk is ready to be processed.
    pattern.lastIndex = 0;

    cb();
  }


  function flush(cb) {
    var match = null;

    // Loop over any remaining matches in the internal buffer.
    while ((match = pattern.exec(inputBuffer)) !== null) {

      // Content prior to match can be returned without modification
      this.push(inputBuffer.slice(0, match.index));

      // TRANSFORM
      this.push(match[0]);

      // Next match must be after this match
      nextOffset = pattern.lastIndex;

      // All content prior to the match can be disposed of
      inputBuffer = inputBuffer.slice(nextOffset);
    }

    // Empty internal buffer
    this.push(inputBuffer);

    // Signal the end of the output stream.
    this.push(null);

    // Signal that the input has been fully processed.
    cb();
  }
}

module.exports = RegExStream;
