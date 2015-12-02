import test from 'ava';
import ResolveStream from '../lib/resolve-stream';


test.cb('should handle no input', (t) => {
  const testStream = new ResolveStream();

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
    chunk: 'The quick brown fox jumps over the lazy dog./n',
  };
  const testStream = new ResolveStream();

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
    chunk: 'The quick brown :[](animal.md) jumps over the lazy dog./n',
    relativePath: 'test',
    link: {
      primary: {
        href: 'animal.md',
        hrefType: 'file',
      },
    },
  };
  const expected = {
    href: 'test/animal.md',
    hrefType: 'file',
  };
  const testStream = new ResolveStream();

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
    chunk: 'The quick brown :[](animal) jumps over the lazy dog./n',
    link: {
      primary: {
        href: 'animal',
        hrefType: 'file',
      },
      references: [
        {
          placeholder: 'animal',
          href: 'wolf.md',
          hrefType: 'file',
        },
        {
          placeholder: 'food',
          href: 'cheese.md',
          hrefType: 'file',
        },
      ],
    },
    parentRefs: [
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
    chunk: 'The quick brown :[](animal) jumps over the lazy dog./n',
    link: {
      primary: {
        href: 'animal',
        hrefType: 'file',
      },
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
      fallback: {
        href: 'fox',
        hrefType: 'string',
      },
    },
  };
  const expected = {
    href: 'fox',
    hrefType: 'string',
  };
  const testStream = new ResolveStream();

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
