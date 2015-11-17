if (process.env.COVERAGE) {
  var blanket = require('blanket');
}

var RegexStream = require('./regex-stream');
var path = require('path');
var _ = require('lodash');
// var utils = require('./utils');
var async = require('async');
var fs = require('fs');


// TODO: move to utils
// Link detection (including leading whitespace)
var linkRegExp = new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))/gm);
var WHITESPACE_GROUP = 1;
var PLACEHOLDER_GROUP = 2;
var LINK_GROUP = 3;


// transcludeStream(input, [logger], [options], output)
//
// Arguments:
//  1. input (stream): TODO
//  2. [log (function)]: Logging function accepting a string as the input
//  3. [options (Object)]: todo
//  4. output (stream): TODO
//
// Returns: (string): Transcluded string
var transcludeStream = function(input, logger, options, output) {

  // TODO: argument validation
  // {input, relativePath, parents, parentRefs, logger, cb} = validateOptionalArgs args
  var relativePath = options.relativePath;
  var parents = options.parents;
  var parentRefs = options.parentRefs;

  //log("Transcluding string...");
  transclude(input, relativePath, parents, parentRefs, logger, output);
};



var transclude = function(input, relativePath, parents, parentRefs, logger, output) {

  var tokenizer = new RegexStream(linkRegExp);

  tokenizer.on('readable', function() {
    var token = null;

    async.whilst(
      function() {
        return (token = tokenizer.read());
      },
      function(done) {
        if (token.tokenType === 'match') {

          output.write('MATCH');
          return done();

        } else {

          output.write(token.content.toString('utf8'));
          return done();

        }
      },
      function(err) {

      }
    );
  });

  tokenizer.on('end', function() {
    output.end()
  });

  input.pipe(tokenizer);
}


//   logger "Links found: #{links.length}"
//   if links.length < 1 then return cb input
//
//   async.eachSeries links, (link, done) ->
//     {href, hrefType, references, parents, whitespace, placeholder} = link
//
//     matchingReferences = parentRefs.filter (ref) -> "#{ref.placeholder}" is "#{href}"
//     overridingReference = matchingReferences[0] || link.default
//     href = overridingReference.href if overridingReference?
//     hrefType = overridingReference.hrefType if overridingReference?
//
//     if overridingReference?
//       logger "Overriding reference: #{JSON.stringify overridingReference}"
//     else if hrefType is "file"
//       href = path.join relativePath, href
//
//     if _.contains parents, href
//       logger "#{href} is in parents:\n#{JSON.stringify parents}"
//       throw new Error("Circular reference detected")
//
//     parents.push href
//     dir = path.dirname href
//     references = _.merge parentRefs, references
//
//     utils.inflate href, hrefType, (content) ->
//       logger "Transcluding: #{href} (#{hrefType}) into #{parents[-1..][0]}"
//       transclude content, dir, parents, references, logger, (output) ->
//         if output?
//           # Preserve leading whitespace and trim excess new lines at EOF
//           output = output
//             .replace /\n/g, "\n#{whitespace}"
//             .replace /\n$/, ""
//
//           input = input.replace "#{placeholder}", output
//         return done()
//   , ->
//     return cb input
//
//
//
//
//
// // Create our regex pattern matching stream.
// var regexStream = new RegExStream( /\w+/i, function(i) { return i; } );
//
// // Read matches from the stream.
// regexStream.on(
//     "readable",
//     function() {
//
//         var content = null;
//
//         // Since the RegExStream operates on "object mode", we know that we'll get a
//         // single match with each .read() call.
//         while ( content = this.read() ) {
//
//             console.log("OUTPUT Pattern match:");
//             console.log("'" + content.toString( "utf8" ) + "'");
//
//         }
//
//     }
// );
//
// // Write input to the stream. I am writing the input in very small chunks so that we
// // can't rely on the fact that the entire content will be available on the first (or
// // any single) transform function.
// "How funky is your chicken? How loose is your goose?".match( /.{1,3}/gi )
//     .forEach(
//         function( chunk ) {
//
//             regexStream.write( chunk, "utf8" );
//
//         }
//     )
// ;
//
// // Close the write-portion of the stream to make sure the last write() gets flushed.
// regexStream.end();

module.exports = {
  transcludeStream
}
