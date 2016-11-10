var hercule = require('hercule');
var stream = require('stream');

// Custom resolver uses documents to resolve links
var documents = {
  'foo.md': 'foo',
  'bar.md': 'bar'
}

function customLinkResolver({ link, relativePath, source, line, column }, cb) {
  const fooStream = new stream.Readable({ objectMode: true });
  fooStream.push(documents[link]);
  fooStream.push(null);
  return cb(null, fooStream, link, relativePath);
}
var options = { resolveLink: customLinkResolver };

function callback(err, output) {
  if (err) console.log(err);
  console.log(output);
}

var welcome = "\
Hercule in browser demo\n\
\n\
Example:\n\
  hercule.transcludeString(':[should become foo](foo.md):[should become bar](bar.md)', options, callback))\n\
\n\
You can experiment by adding more documents to the `documents` object (documents['fizz.md'] = 'fizzbuzz')\n\
or modifying the `customLinkResolver` function.";

console.log(welcome);

hercule.transcludeString(':[should become foo](foo.md):[should become bar](bar.md)', options, callback);
