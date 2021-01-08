const path = require('path');

const through2 = require('through2');
const sourceMap = require('source-map');

function updateCursor(cursor, content) {
  const currentLine = cursor.line;
  const currentColumn = cursor.column;

  const newLines = (content.match(/\n/g) || []).length;
  const newColumns = (content.match(/.*$/g) || [''])[0].length;

  const line = currentLine + newLines;
  const column = newLines > 0 ? newColumns : currentColumn + newColumns;

  return { line, column };
}

function Sourcemap(generatedFile = 'string') {
  const mappings = [];
  let cursor = {
    line: 1,
    column: 0,
  };

  function transform(chunk, encoding, cb) {
    const { content } = chunk;
    const originalLocation = { line: chunk.line, column: chunk.column };

    if (content === '') return cb();
    if (!generatedFile) return cb();

    mappings.push({
      source: path.relative(path.dirname(generatedFile), chunk.source),
      original: originalLocation,
      generated: cursor,
    });
    cursor = updateCursor(cursor, content);

    this.push(chunk);
    return cb();
  }

  function flush(cb) {
    if (!generatedFile) return cb();

    const generator = new sourceMap.SourceMapGenerator({
      file: path.relative(__dirname, generatedFile),
    });
    mappings.forEach(map => generator.addMapping(map));
    this.emit('sourcemap', JSON.parse(generator.toString()));
    return cb();
  }

  return through2.obj(transform, flush);
}

module.exports = { Sourcemap };
