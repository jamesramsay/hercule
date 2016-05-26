import test from 'ava';
import { parseTransclude } from '../../../src/resolve';

test.cb('should parse simple link', (t) => {
  const link = 'animal.md';
  const relativePath = '/foo';
  const source = '/foo/bar.md';

  parseTransclude(link, relativePath, source, (err, primary, fallback, references) => {
    t.ifError(err);
    t.deepEqual(primary, { link, relativePath, source });
    t.falsy(fallback);
    t.deepEqual(references, []);
    t.end();
  });
});

test.cb('should parse input with fallback', (t) => {
  const link = 'animal || wolf.md';
  const relativePath = '/foo';
  const source = '/foo/bar.md';
  const expectedPrimary = 'animal';
  const expectedFallback = 'wolf.md';

  parseTransclude(link, relativePath, source, (err, primary, fallback, references) => {
    t.ifError(err);
    t.deepEqual(primary, { link: expectedPrimary, relativePath, source });
    t.deepEqual(fallback, { link: expectedFallback, relativePath, source });
    t.deepEqual(references, []);
    t.end();
  });
});

test.cb('should parse input with references', (t) => {
  const link = 'animal canis:wolf.md vulpes:http://en.wikipedia.org/wiki/Fox';
  const relativePath = '/foo';
  const source = '/foo/bar.md';
  const expectedPrimary = 'animal';
  const expectedReferences = [
    {
      placeholder: 'canis',
      link: 'wolf.md',
      relativePath,
      source,
    },
    {
      placeholder: 'vulpes',
      link: 'http://en.wikipedia.org/wiki/Fox',
      relativePath,
      source,
    },
  ];

  parseTransclude(link, relativePath, source, (err, primary, fallback, references) => {
    t.ifError(err);
    t.deepEqual(primary, { link: expectedPrimary, relativePath, source });
    t.falsy(fallback);
    t.deepEqual(references, expectedReferences);
    t.end();
  });
});

test.cb('should return error if link cannot be parsed', (t) => {
  const link = 'animal.md :dog:cat';
  const relativePath = '/foo';
  const source = '/foo/bar.md';

  parseTransclude(link, relativePath, source, (err) => {
    t.truthy(err);
    t.end();
  });
});
