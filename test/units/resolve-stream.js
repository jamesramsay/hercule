import test from 'ava';
import grammar from '../../lib/transclude-parser';
import ResolveStream from '../../lib/resolve-stream';


test.cb('should handle no input', (t) => {
  const testStream = new ResolveStream(grammar);

  testStream.on('readable', function read() {
    if (this.read() !== null) t.fail();
  });

  testStream.on('end', function end() {
    t.pass();
    t.end();
  });

  testStream.end();
});


test.cb('should skip input without link', (t) => {
  const input = {
    content: 'The quick brown fox jumps over the lazy dog./n',
  };
  const testStream = new ResolveStream(grammar);

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.notOk(chunk.link);
    }
  });

  testStream.on('end', function end() {
    t.pass();
    t.end();
  });

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input simple link', (t) => {
  const input = {
    content: 'The quick brown :[](animal.md) jumps over the lazy dog./n',
    link: {
      href: 'animal.md',
    },
  };
  const expected = {
    href: 'animal.md',
    hrefType: 'file',
  };
  const testStream = new ResolveStream(grammar);

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.same(chunk.link, expected);
    }
  });

  testStream.on('end', function end() {
    t.pass();
    t.end();
  });

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input with overriding link', (t) => {
  const input = {
    content: 'The quick brown :[](animal) jumps over the lazy dog./n',
    link: {
      href: 'animal animal:wolf.md food:cheese.md',
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
  const testStream = new ResolveStream(grammar);

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.same(chunk.link, expected);
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  testStream.write(input);
  testStream.end();
});


test.cb('should parse input with fallback link', (t) => {
  const input = {
    content: 'The quick brown :[](animal) jumps over the lazy dog./n',
    link: {
      href: 'animal || "fox" feline:cat.md food:cheese.md',
    },
  };
  const expected = {
    content: 'The quick brown :[](animal) jumps over the lazy dog./n',
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
  const testStream = new ResolveStream(grammar);

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.same(chunk, expected);
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  testStream.write(input);
  testStream.end();
});


test.cb('should handle parse error', (t) => {
  const input = {
    content: ':[](animal.md foo:bar:"exception!")',
    link: {
      href: 'animal.md foo:bar:"exception!"',
    },
  };
  const testStream = new ResolveStream(grammar);

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.same(chunk, input);
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

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
  const testStream = new ResolveStream(grammar);

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.same(chunk, expected);
    }
  });

  testStream.on('end', function end() {
    t.end();
  });

  testStream.write(input);
  testStream.end();
});
