transcludeGrammar = """
start
  = ':' '[' placeholder? ']' '(' f:filename? ' '? o:arg* ')' {
      return {
        "link": f,
        "references": o
      };
    }

arg
  = left:placeholder ':' right:override ' '? {
      return {
        "placeholder": left,
        "type": right.type,
        "value": right.value
      };
    }

placeholder
  = p:[a-zA-Z0-9]+ {
      return p.join("");
    }

filename
  = f:[^ ()\"]+ {
      return f.join("");
    }

override
  = file / string / reset

file
  = f:filename {
      return {
        "type": "file",
        "value": f
      };
    }

string
  = '\"' s:([^\"]+) '\"' {
      return {
        "type": "string",
        "value": s.join("")
      };
    }

reset
  = {
      return {
        "type": "string",
        "value": ""
      };
    }
"""

module.exports = {
  transcludeGrammar
}
