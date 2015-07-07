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
start = f:link? ' '? o:reference* {
  return {
    "link": f.value,
    "type": f.type,
    "references": o
  };
}

reference = p:placeholder ':' l:link ' '? {
  return {
    "placeholder": p,
    "type": l.type,
    "value": l.value
  };
}

placeholder = p:[a-zA-Z0-9]+ {
  return p.join("");
}

link = httpLink / fileLink / string / reset

fileLink = f:[^ ()\"]+ {
  return {
    "type": "file",
    "value": f.join("")
  };
}

httpLink = left:("http://" / "https://") right:[^ ()]+ {
  return {
    "type": "http",
    "value": left + right.join("")
  };
}

string = '\"' s:([^\"]+) '\"' {
  return {
    "type": "string",
    "value": s.join("")
  };
}

reset = {
  return {
    "type": "string",
    "value": ""
  };
}
"""

module.exports = {
  transcludeGrammar
}
