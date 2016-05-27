start = p:primary " || "? f:fallback? " "? r:reference* {
  return {
    "primary": p,
    "fallback": f,
    "references": r
  };
}

reference = p:placeholder ":" l:primary " "? {
  return {
    "placeholder": p,
    "link": l
  };
}

placeholder = p:[a-zA-Z0-9]+ {
  return p.join("");
}

primary = unquotedString / quotedString / reset

fallback = unquotedString / quotedString

reset = "" {
  return {
    "match": "\"\"",
    "index": location().start.offset
  };
}

unquotedString = chars:[^ \"]+ {
  return {
    "match": chars.join(""),
    "index": location().start.offset
  };
}

quotedString = QUOTATION_MARK chars:char* QUOTATION_MARK {
  chars.unshift("\"");
  chars.push("\"");
  return {
    "match": chars.join(""),
    "index": location().start.offset
  };
}

char = UNESCAPED / ESCAPE sequence:(
        "\""
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

ESCAPE         = "\\"
QUOTATION_MARK = "\""
UNESCAPED      = [\x20-\x21\x23-\x5B\x5D-\u10FFFF]
HEXDIG         = [0-9a-f]i
