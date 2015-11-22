start = p:primary? " || "? f:fallback? " "? r:reference* {
  return {
    "primary": p,
    "fallback": f,
    "references": r
  };
}

reference = p:placeholder ":" l:primary " "? {
  return {
    "placeholder": p,
    "href": l.href,
    "hrefType": l.hrefType
  };
}

placeholder = p:[a-zA-Z0-9]+ {
  return p.join("");
}

primary = httpLink / fileLink / stringLink / reset

fallback = httpLink / fileLink / stringLink

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

stringLink = s:string {
  return {
    "hrefType": "string",
    "href": s
  };
}

reset = "" {
  return {
    "hrefType": "string",
    "href": ""
  };
}

string = QUOTATION_MARK chars:char* QUOTATION_MARK {
  return chars.join("");
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
