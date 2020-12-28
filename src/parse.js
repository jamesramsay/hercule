import grammar from '../grammars/link';

function extendWithSource(link, source, line, column) {
  const { url, placeholder } = link;
  return { url, placeholder, source, line, column: column + link.index };
}

// eslint-disable-next-line import/prefer-default-export
export function parseContent(content, { source, line, column }) {
  const args = grammar.parse(content);

  // Attach source information to all the url to be resolved
  const contentLink = extendWithSource(args.link, source, line, column);
  const scopeReferences = args.scopeReferences.map(ref =>
    extendWithSource(ref, source, line, column)
  );
  const descendantReferences = args.descendantReferences.map(ref =>
    extendWithSource(ref, source, line, column)
  );

  return { contentLink, scopeReferences, descendantReferences };
}
