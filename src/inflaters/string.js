import { Readable } from 'stream';

/**
 * String transclusion is trigered by strings inside the transclusion link, and cannot contain links themselves.
 *
 * This will also simplify handling of reference and fallback expansion strings.
 */
export default function inflate(content, source) {
  const stringStream = new Readable({ objectMode: true });
  stringStream.push({ content, source });
  stringStream.push(null);
  return stringStream;
}
