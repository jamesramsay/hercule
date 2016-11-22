import test from 'ava';
import spigot from 'stream-spigot';
import TrimStream from '../../src/trim-stream';


test.cb('should handle no input', (t) => {
  const testStream = new TrimStream();

  testStream.on('readable', function read() {
    if (this.read() !== null) t.fail();
  });

  testStream.on('end', () => {
    t.pass();
    t.end();
  });

  testStream.end();
});


test.cb('should not modify input stream from a single source', (t) => {
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

  const testStream = new TrimStream();
  const output = [];

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output.push(chunk);
    }
  });

  testStream.on('end', () => {
    t.deepEqual(output, input);
    t.end();
  });

  spigot({ objectMode: true }, input).pipe(testStream);
});


test.cb('should handle advanced scenario', (t) => {
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
  const testStream = new TrimStream();
  const output = [];
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

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output.push(chunk);
    }
  });

  testStream.on('end', () => {
    t.deepEqual(output, expect);
    t.end();
  });

  spigot({ objectMode: true }, input).pipe(testStream);
});

test.cb('should handle multiple new line scenarios', (t) => {
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
  const testStream = new TrimStream();
  const output = [];
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

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output.push(chunk);
    }
  });

  testStream.on('end', () => {
    t.deepEqual(output, expect);
    t.end();
  });

  spigot({ objectMode: true }, input).pipe(testStream);
});
