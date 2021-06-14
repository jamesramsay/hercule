import test from 'ava';
import spigot from 'stream-spigot';
import getStream from 'get-stream';

import { Trim } from '../../lib/trim';

test.cb('should not modify input stream from a single source', t => {
  const input = [
    {
      content: 'The quick brown\n',
      parents: [],
      source: 'index.md',
    },
    {
      content: 'fox jumps\n',
      parents: [],
      source: 'index.md',
    },
    {
      content: 'over the lazy dog.\n',
      parents: [],
      source: 'index.md',
    },
  ];

  const testStream = new Trim();

  spigot({ objectMode: true }, input).pipe(testStream);

  getStream
    .array(testStream)
    .then(output => {
      t.deepEqual(output, input);
      t.end();
    })
    .catch(err => t.fail(err));
});

test.cb('should handle advanced scenario', t => {
  const input = [
    {
      content: 'The quick brown fox ',
      parents: [],
      source: 'index.md',
    },
    {
      content: 'jumps over the ',
      parents: ['index.md'],
      source: 'activity.md',
    },
    {
      content: 'lazy\n',
      parents: ['index.md', 'activity.md'],
      source: 'disinterest.md',
    },
    {
      content: ' ',
      parents: ['index.md'],
      source: 'activity.md',
    },
    {
      content: 'dog',
      parents: [],
      source: 'index.md',
    },
    {
      content: '\n',
      parents: ['index.md'],
      source: 'activity.md',
    },
    {
      content: '\n',
      parents: [],
      source: 'index.md',
    },
  ];
  const expect = [
    {
      content: 'The quick brown fox ',
      parents: [],
      source: 'index.md',
    },
    {
      content: 'jumps over the ',
      parents: ['index.md'],
      source: 'activity.md',
    },
    {
      content: 'lazy',
      parents: ['index.md', 'activity.md'],
      source: 'disinterest.md',
    },
    {
      content: ' ',
      parents: ['index.md'],
      source: 'activity.md',
    },
    {
      content: 'dog',
      parents: [],
      source: 'index.md',
    },
    {
      content: '\n',
      parents: ['index.md'],
      source: 'activity.md',
    },
  ];
  const testStream = new Trim();

  spigot({ objectMode: true }, input).pipe(testStream);

  getStream
    .array(testStream)
    .then(output => {
      t.deepEqual(output, expect);
      t.end();
    })
    .catch(err => t.fail(err));
});

test.cb('should handle multiple new line scenarios', t => {
  const input = [
    {
      content: 'The quick brown fox\n',
      parents: ['index.md', 'a.md', 'b.md'],
      source: 'c.md',
    },
    {
      content: '\n',
      parents: ['index.md', 'a.md'],
      source: 'b.md',
    },
    {
      content: '\n',
      parents: ['index.md'],
      source: 'a.md',
    },
    {
      content: '\njumps over the lazy dog.\n',
      parents: ['index.md'],
      source: 'a.md',
    },
    {
      content: '\n',
      parents: ['index.md'],
      source: 'a.md',
    },
    {
      content: 'foobar',
      parents: undefined,
      source: 'index.md',
    },
  ];
  const expect = [
    {
      content: 'The quick brown fox\n',
      parents: ['index.md', 'a.md', 'b.md'],
      source: 'c.md',
    },
    {
      content: '\njumps over the lazy dog.\n',
      parents: ['index.md'],
      source: 'a.md',
    },
    {
      content: '\n',
      parents: ['index.md'],
      source: 'a.md',
    },
    {
      content: 'foobar',
      parents: undefined,
      source: 'index.md',
    },
  ];
  const testStream = new Trim();

  spigot({ objectMode: true }, input).pipe(testStream);

  getStream
    .array(testStream)
    .then(output => {
      t.deepEqual(output, expect);
      t.end();
    })
    .catch(err => t.fail(err));
});
