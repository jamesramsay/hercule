import test from 'ava';

import { grammar } from '../../src/grammar';

test('should parse simple link', t => {
  const link = 'test.md';
  const expect = {
    link: {
      url: 'test.md',
      placeholder: 'test.md',
      index: 0,
    },
    scopeReferences: [],
    descendantReferences: [],
  };

  const output = grammar.parse(link);

  t.deepEqual(output, expect);
});

test('should parse link with fallback', t => {
  const link = 'animal || fox.md';
  const expect = {
    link: {
      url: 'animal',
      placeholder: 'animal',
      index: 0,
    },
    scopeReferences: [
      {
        url: 'fox.md',
        placeholder: 'animal',
        index: 10,
      },
    ],
    descendantReferences: [],
  };

  const output = grammar.parse(link);

  t.deepEqual(output, expect);
});

test('should parse link with references', t => {
  const link =
    'animal vulpis:fox.md reset: singlestring:\'foobar\' doublestring:"fizz-buzz"';
  const expect = {
    link: {
      url: 'animal',
      placeholder: 'animal',
      index: 0,
    },
    scopeReferences: [],
    descendantReferences: [
      {
        url: 'fox.md',
        placeholder: 'vulpis',
        index: 14,
      },
      {
        url: '""',
        placeholder: 'reset',
        index: 27,
      },
      {
        url: "'foobar'",
        placeholder: 'singlestring',
        index: 41,
      },
      {
        url: '"fizz-buzz"',
        placeholder: 'doublestring',
        index: 63,
      },
    ],
  };

  const output = grammar.parse(link);

  t.deepEqual(output, expect);
});

test('should parse link with fallback and references', t => {
  const link = 'animal || fox.md canine:dog.md';
  const expect = {
    link: {
      url: 'animal',
      placeholder: 'animal',
      index: 0,
    },
    scopeReferences: [
      {
        url: 'fox.md',
        placeholder: 'animal',
        index: 10,
      },
    ],
    descendantReferences: [
      {
        url: 'dog.md',
        placeholder: 'canine',
        index: 24,
      },
    ],
  };

  const output = grammar.parse(link);

  t.deepEqual(output, expect);
});
