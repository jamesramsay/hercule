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
        t.notOk(chunk.link);
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
    link: {
      href: 'animal.md',
    },
  };
  const expected = {
    href: 'animal.md',
    hrefType: 'file',
  };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk.link, expected);
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
    link: {
      href: 'animal animal:wolf.md food:"cheese" remote:http://github.com/example.md null:',
    },
  };
  const expected = [
    {
      placeholder: 'animal',
      href: 'wolf.md',
      hrefType: 'file',
    },
    {
      placeholder: 'food',
      href: 'cheese',
      hrefType: 'string',
    },
    {
      placeholder: 'remote',
      href: 'http://github.com/example.md',
      hrefType: 'http',
    },
    {
      placeholder: 'null',
      href: '',
      hrefType: 'string',
    },
  ];
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk.references, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input with overriding link', (t) => {
  const input = {
    content: ':[](animal animal:wolf.md)',
    link: {
      href: 'animal animal:wolf.md',
    },
    references: [
      {
        placeholder: 'animal',
        href: 'fox.md',
        hrefType: 'file',
      },
      {
        placeholder: 'food',
        href: 'cheese.md',
        hrefType: 'file',
      },
    ],
  };
  const expected = {
    href: 'fox.md',
    hrefType: 'file',
  };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk.link, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input with fallback link', (t) => {
  const input = {
    content: ':[](animal || "fox" feline:cat.md food:cheese.md)',
    link: {
      href: 'animal || "fox" feline:cat.md food:cheese.md',
    },
  };
  const expected = {
    content: ':[](animal || "fox" feline:cat.md food:cheese.md)',
    references: [
      {
        placeholder: 'feline',
        href: 'cat.md',
        hrefType: 'file',
      },
      {
        placeholder: 'food',
        href: 'cheese.md',
        hrefType: 'file',
      },
    ],
    link: {
      href: 'fox',
      hrefType: 'string',
    },
  };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should emit error on invalid transclusion link', (t) => {
  const input = {
    content: ':[](animal.md foo:bar:"exception!")',
    link: {
      href: 'animal.md foo:bar:"exception!"',
    },
  };
  const testStream = new ResolveStream();

  t.plan(2);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk, input);
      }
    })
    .on('error', () => t.pass())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});


test.cb('should resolve link relative to file', (t) => {
  const input = {
    content: ':[](animal.md)',
    link: {
      href: 'animal.md',
    },
    relativePath: 'foo',
  };
  const expected = {
    content: ':[](animal.md)',
    references: [],
    link: {
      href: 'foo/animal.md',
      hrefType: 'file',
    },
    relativePath: 'foo',
  };
  const testStream = new ResolveStream();

  t.plan(1);
  testStream
    .on('readable', function read() {
      let chunk = null;
      while ((chunk = this.read()) !== null) {
        t.same(chunk, expected);
      }
    })
    .on('error', () => t.fail())
    .on('end', () => t.end());

  testStream.write(input);
  testStream.end();
});
