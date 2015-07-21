# Parses transclusion links
#
# :[example transclude link](file.md || "default value" common:file.md)
#
# {
#  href: file.md
#  hrefType: file
#  references: [
#     placeholder: common
#     type: file
#     value: file.md
#   ]
#  default: {
#   type: string
#   value: default value
#  }
# }

transcludeGrammar = """
start = l:link? ' || '? d:default? ' '? o:reference* {
  return {
    "href": l.href,
    "hrefType": l.hrefType,
    "references": o,
    "default": d
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

default = emptyString / string

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

emptyString = '\"' '\"' {
  return {
    "hrefType": "string",
    "href": ""
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
