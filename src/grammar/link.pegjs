Start
  = link:Url fallbackLink:Fallback? references:Reference* {
    link.placeholder = link.url;
    if (fallbackLink) fallbackLink.placeholder = link.url;
    return {
      link,
      scopeReferences: fallbackLink ? [fallbackLink] : [],
      descendantReferences: references
    };
  }

Url
  = UnquotedString / QuotedString / Reset

Fallback
  = _ "||" _ url:Url {
    return url;
  }

Reference = _ placeholder:Placeholder ":" ref:Url {
  ref.placeholder = placeholder;
  return ref;
}

Placeholder = p:[a-zA-Z0-9]+ {
  return p.join("");
}

Reset = "" {
  return {
    "url": "\"\"",
    "index": location().start.offset
  };
}

UnquotedString = chars:[^ \"]+ {
  return {
    "url": chars.join(""),
    "index": location().start.offset
  };
}

QuotedString = QUOTATION_MARK chars:char* QUOTATION_MARK {
  chars.unshift("\"");
  chars.push("\"");
  return {
    "url": chars.join(""),
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
    )
    { return sequence; }

_              = " "+
ESCAPE         = "\\"
QUOTATION_MARK = "\""
UNESCAPED      = [\x20-\x21\x23-\x5B\x5D-\u10FFFF]
