# Parses transclusion links
#
# :[example transclude link](file.md common:file.md)
#
# {
#  link: file.md
#  type: file
#  references: [
#     placeholder: common
#     type: file
#     value: file.md
#   ]
# }

transcludeGrammar = """
start = l:link? ' '? o:reference* {
  return {
    "href": l.href,
    "hrefType": l.hrefType,
    "references": o
  };
}

reference = p:placeholder ':' l:link ' '? {
  return {
    "placeholder": p,
    "href": l.href,
    "hrefType": l.hrefType
  };
}

placeholder = p:[a-zA-Z0-9]+ {
  return p.join("");
}

link = httpLink / fileLink / string / reset

fileLink = f:[^ ()\"]+ {
  return {
    "hrefType": "file",
    "href": f.join("")
  };
}

httpLink = left:("http://" / "https://") right:[^ ()]+ {
  return {
    "hrefType": "http",
    "href": left + right.join("")
  };
}

string = '\"' s:([^\"]+) '\"' {
  return {
    "hrefType": "string",
    "href": s.join("")
  };
}

reset = {
  return {
    "hrefType": "string",
    "href": ""
  };
}
"""

module.exports = {
  transcludeGrammar
}
