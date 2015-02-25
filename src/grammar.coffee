transcludeGrammar = """
start
  = f:file ' '? o:arg* {
      return {
        "file": f.value,
        "overrides": o
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

override
  = file / string / reset

file
  = f:[^ \"]+ {
      return {
        "type": "file",
        "value": f.join("")
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
