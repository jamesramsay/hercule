import test from 'ava';
import ResolveStream from '../../lib/resolve-stream';


test.cb('should handle no input', (t) => {
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      if (this.read() !== null) t.fail();
    })
    .on('error', () => t.fail())
    .on('end', () => {
      t.pass();
      t.end();
    });

  testStream.end();
});


test.cb('should skip input without link', (t) => {
  const input = { content: 'The quick brown fox jumps over the lazy dog./n' };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.falsy(chunk.link);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input simple link', (t) => {
  const input = {
    content: ':[](animal.md)',
    link: 'animal.md',
  };
  const expectedLink = 'animal.md';
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.deepEqual(chunk.link, expectedLink);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input with overrides', (t) => {
  const input = {
    content: ':[](animal animal:wolf.md food:"cheese" remote:http://github.com/example.md null:)',
    link: 'animal animal:wolf.md food:"cheese" remote:http://github.com/example.md null:',
  };
  const expectedReferences = [
    {
      placeholder: 'animal',
      link: 'wolf.md',
      relativePath: '',
    },
    {
      placeholder: 'food',
      link: '"cheese"',
      relativePath: '',
    },
    {
      placeholder: 'remote',
      link: 'http://github.com/example.md',
      relativePath: '',
    },
    {
      placeholder: 'null',
      link: '""',
      relativePath: '',
    },
  ];
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.deepEqual(chunk.references, expectedReferences);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should parse and resolve link with correct overriding link', (t) => {
  const input = {
    content: ':[](animal animal:wolf.md)',
    link: 'animal animal:wolf.md',
    references: [
      {
        placeholder: 'animal',
        link: 'fox.md',
      },
      {
        placeholder: 'food',
        link: 'cheese.md',
      },
    ],
  };
  const expectedLink = 'fox.md';
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.deepEqual(chunk.link, expectedLink);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should parse and resolve link using fallback link if no overriding reference available', (t) => {
  const input = {
    content: ':[](animal || "fox" feline:cat.md food:cheese.md)',
    link: 'animal || "fox" feline:cat.md food:cheese.md',
  };
  const expected = {
    content: ':[](animal || "fox" feline:cat.md food:cheese.md)',
    references: [
      {
        placeholder: 'feline',
        link: 'cat.md',
        relativePath: '',
      },
      {
        placeholder: 'food',
        link: 'cheese.md',
        relativePath: '',
      },
    ],
    link: '"fox"',
    relativePath: '',
  };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.deepEqual(chunk, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should emit error on invalid link', (t) => {
  const input = {
    content: ':[](animal.md foo:bar:"exception!")',
    link: 'animal.md foo:bar:"exception!"',
  };
  const testStream = new ResolveStream();

  t.plan(2);
  testStream
    .on('readable', function read() {
      this.read();
    })
    .on('error', (err) => {
      t.deepEqual(err.message, 'Link could not be parsed');
      t.deepEqual(err.path, 'animal.md foo:bar:"exception!"');
    })
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should parse link and return references with correct relative path', (t) => {
  const input = {
    content: ':[](animal.md)',
    link: 'animal.md canine:dog.md',
    relativePath: 'foo',
  };
  const expected = {
    content: ':[](animal.md)',
    references: [
      {
        placeholder: 'canine',
        link: 'dog.md',
        relativePath: 'foo',
      },
    ],
    link: 'animal.md',
    relativePath: 'foo',
  };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.deepEqual(chunk, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});
