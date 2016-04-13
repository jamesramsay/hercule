start = httpLink / localLink / stringLink

localLink = f:[^ ()\"]+ {
  return "local";
}

httpLink = left:("http://" / "https://") right:[^ ()]+ {
  return "http";
}

stringLink = .* {
  return "string"
}
