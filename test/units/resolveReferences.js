import test from 'ava';
import { resolveReferences } from '../../lib/resolve';

test('should resolve to pimary if none other provided', (t) => {
  const primary = { link: 'animal.md', relativePath: '/foo' };
  const fallback = null;
  const references = [];
  const expectedLink = { link: 'animal.md', relativePath: '/foo' };

  t.deepEqual(resolveReferences(primary, fallback, references), expectedLink);
});

test('should resolve to fallback if no matching references provided', (t) => {
  const primary = { link: 'animal.md', relativePath: '/foo' };
  const fallback = { link: 'fox.md', relativePath: '/bar' };
  const references = [];
  const expectedLink = { link: 'fox.md', relativePath: '/bar' };

  t.deepEqual(resolveReferences(primary, fallback, references), expectedLink);
});

test('should resolve to reference if a matching reference provided', (t) => {
  const primary = { link: 'animal.md', relativePath: '/foo' };
  const fallback = null;
  const references = [{ placeholder: 'animal.md', link: 'fox.md', relativePath: '/bar' }];
  const expectedLink = { placeholder: 'animal.md', link: 'fox.md', relativePath: '/bar' };

  t.deepEqual(resolveReferences(primary, fallback, references), expectedLink);
});
