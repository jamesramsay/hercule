var through2 = require( "through2" );

function NestedStream() {
  return(through2.obj(transform, flush));


  function transform(chunk, encoding, cb) {

    // Detect match
    innerStream = fs.createReadStream('test.md', {encoding: 'utf8'});

    innerStream.on('readable', )

    this.push(chunk.toString('utf8'));

    cb();
  }


  function flush(cb) {
    this.push(null);
    cb();
  }
}


// Create our regex pattern matching stream.
var nestedStream = new NestedStream();

// Read matches from the stream.
nestedStream.on(
  "readable",
  function() {
    var content = null;

    while ( content = this.read() ) {
      console.log("OUTPUT: '" + content.toString("utf8") + "'");
    }
  }
);

// Write input to the stream. I am writing the input in very small chunks so that we
// can't rely on the fact that the entire content will be available on the first (or
// any single) transform function.
"How funky is your chicken? How loose is your goose?".match( /.{1,3}/gi )
  .forEach(
    function( chunk ) {

      nestedStream.write( chunk, "utf8" );

    }
  )
;

// Close the write-portion of the stream to make sure the last write() gets flushed.
nestedStream.end();
