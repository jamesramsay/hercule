var path = require('path');

/*

:[description](primary || fallback ovveride)

insertion point: index of leading colon (`:`)

- primary (Link)
- fallback (Link)
- references (array[Link])


Link (object)
- href
- hrefType

*/


var relativiseLink = function(link, relativePath) {
  if (link.hrefType === 'file') {
    link.href = path.join(relativePath, link.href);
  }

  return link;
}


// Parse a transclude link
var parse = function(match, relativePath) {
  var transcludeLink = transcludeParser.parse(match);

  relativiseLink(transcludeLink.primary, relativePath)
  relativiseLink(transcludeLink.fallback, relativePath)

  transcludeLink.references.forEach(function(ref) {
    relativiseLink(ref, relativePath);
  });

  return parsedMatch
}
