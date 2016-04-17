import test from 'ava';
import { parseTransclude } from '../../../lib/resolve';

test.cb('should parse simple link', (t) => {
  const link = 'animal.md';
  const relativePath = '/foo';
  const expectedLink = 'animal.md';

  parseTransclude(link, relativePath, (err, primary, fallback, references) => {
    t.ifError(err);
    t.deepEqual(primary, { link: expectedLink, relativePath });
    t.falsy(fallback);
    t.deepEqual(references, []);
    t.end();
  });
});

test.cb('should parse input with fallback', (t) => {
  const link = 'animal || wolf.md';
  const relativePath = '/foo';
  const expectedPrimary = 'animal';
  const expectedFallback = 'wolf.md';

  parseTransclude(link, relativePath, (err, primary, fallback, references) => {
    t.ifError(err);
    t.deepEqual(primary, { link: expectedPrimary, relativePath });
    t.deepEqual(fallback, { link: expectedFallback, relativePath });
    t.deepEqual(references, []);
    t.end();
  });
});

test.cb('should parse input with references', (t) => {
  const link = 'animal canis:wolf.md vulpes:http://en.wikipedia.org/wiki/Fox';
  const relativePath = '/foo';
  const expectedPrimary = 'animal';
  const expectedReferences = [
    {
      placeholder: 'canis',
      link: 'wolf.md',
      relativePath,
    },
    {
      placeholder: 'vulpes',
      link: 'http://en.wikipedia.org/wiki/Fox',
      relativePath,
    },
  ];

  parseTransclude(link, relativePath, (err, primary, fallback, references) => {
    t.ifError(err);
    t.deepEqual(primary, { link: expectedPrimary, relativePath });
    t.falsy(fallback);
    t.deepEqual(references, expectedReferences);
    t.end();
  });
});

test.cb('should return error if link cannot be parsed', (t) => {
  const link = 'animal.md :dog:cat';
  const relativePath = '/foo';

  parseTransclude(link, relativePath, (err) => {
    t.truthy(err);
    t.end();
  });
});
