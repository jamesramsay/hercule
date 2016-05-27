import test from 'ava';
import { parseTransclude } from '../../../src/resolve';

test.cb('should parse simple link', (t) => {
  const link = 'animal.md';
  const relativePath = '/foo';
  const source = '/foo/bar.md';
  const line = 1;
  const column = 0;

  parseTransclude(link, relativePath, source, { line, column }, (err, primary, fallback, references) => {
    t.ifError(err);
    t.deepEqual(primary, { link, relativePath, source, line, column });
    t.falsy(fallback);
    t.deepEqual(references, []);
    t.end();
  });
});

test.cb('should parse input with fallback', (t) => {
  const link = 'animal || wolf.md';
  const relativePath = '/foo';
  const source = '/foo/bar.md';
  const line = 1;
  const column = 0;

  const expectedPrimary = 'animal';
  const expectedFallback = 'wolf.md';

  parseTransclude(link, relativePath, source, { line, column }, (err, primary, fallback, references) => {
    t.ifError(err);
    t.deepEqual(primary, { link: expectedPrimary, relativePath, source, line, column: 0 });
    t.deepEqual(fallback, { link: expectedFallback, relativePath, source, line, column: 10 });
    t.deepEqual(references, []);
    t.end();
  });
});

test.cb('should parse input with references', (t) => {
  const link = 'animal canis:wolf.md vulpes:http://en.wikipedia.org/wiki/Fox';
  const relativePath = '/foo';
  const source = '/foo/bar.md';
  const line = 1;
  const column = 0;

  const expectedPrimary = 'animal';
  const expectedReferences = [
    {
      placeholder: 'canis',
      link: 'wolf.md',
      relativePath,
      source,
      line,
      column: 13,
    },
    {
      placeholder: 'vulpes',
      link: 'http://en.wikipedia.org/wiki/Fox',
      relativePath,
      source,
      line,
      column: 28,
    },
  ];

  parseTransclude(link, relativePath, source, { line, column }, (err, primary, fallback, references) => {
    t.ifError(err);
    t.deepEqual(primary, { link: expectedPrimary, relativePath, source, line, column });
    t.falsy(fallback);
    t.deepEqual(references, expectedReferences);
    t.end();
  });
});

test.cb('should return error if link cannot be parsed', (t) => {
  const link = 'animal.md :dog:cat';
  const relativePath = '/foo';
  const source = '/foo/bar.md';
  const line = 1;
  const column = 0;

  parseTransclude(link, relativePath, source, { line, column }, (err) => {
    t.truthy(err);
    t.end();
  });
});
