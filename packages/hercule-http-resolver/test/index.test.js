import test from 'ava';
import isStream from 'isstream';

import httpResolver from '../src';

test('returns stream if http url', t => {
  const { content } = httpResolver('https://127.0.0.1');
  t.truthy(isStream(content));
});

test('returns falsy if not http url', t => {
  t.falsy(httpResolver('foo.md'));
});
