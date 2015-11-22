var through2 = require( "through2" );

function IndentStream(indentationIn) {

  var indentation = "\n" + indentationIn;
  return(through2.obj(transform, flush));

  function transform(chunk, encoding, cb) {
    output = chunk.toString('utf8');
    output = output.replace(/\n/g, indentation);
    this.push(output);
    cb();
  }


  function flush(cb) {
    this.push(null);
    cb();
  }
}

module.exports = IndentStream;
