import fs from 'fs';

/**
 * inflate() returns a readable stream of the file excluding the terminating <newline> character of the last line.
 * This permits inline and in-paragraph transclusion as some aspects of markdown are sensitive to newlines.
 *
 * @param {string} link - Absolute path to the file to be transcluded
 * @return {object} outputStream - Readable stream object
 */
export default function inflate(link) {
  const localStream = fs.createReadStream(link, { encoding: 'utf8' });

  return localStream;
}
