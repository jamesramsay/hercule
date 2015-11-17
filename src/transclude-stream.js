var through2 = require( "through2" );

// TODO: Add flags to enable handling of:
//  - regular expressions which can mach one character width ( /\w+/) (FALSE)
//  - regular expressions which have a defined end (/\(w+\)/) (FALSE)
//  - return un-transformed text (TRUE)

function TrasncludeStream() {

  // Link detection (including leading whitespace)
  var pattern = new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))/gm);
  var WHITESPACE_GROUP = 1;
  var PLACEHOLDER_GROUP = 2;
  var LINK_GROUP = 3;

  var inputBuffer = "";

  return(through2.obj(transform, flush));


  function transclude(link, sink, cb) {

    (new TranscludeStream())
    .on('readable', function() {
      var content = null;
      while (content = this.read()) {
        this.push(content.toString('utf8'));
      }
    })
    .on('end', function() {

    });

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


      transclude(match, this.push, function() {
        // Next match must be after this match
        nextOffset = pattern.lastIndex;

        // All content prior to the match can be disposed of
        inputBuffer = inputBuffer.slice(nextOffset);

      });
    }

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
      this.push(
        matchTransformer(match[0])
      );

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

module.exports = TrasncludeStream;
