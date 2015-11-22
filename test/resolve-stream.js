import test  from 'ava';
import ResolveStream from '../src/resolve-stream';


test('should handle no input', (t) => {

  let testStream = new ResolveStream();

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.fail();
    }
  });

  testStream.on('end', function() {
    t.pass();
    t.end();
  });

  testStream.end();

});


test('should skip input without link', (t) => {
  let input = {
    chunk: 'The quick brown fox jumps over the lazy dog./n'
  }

  let testStream = new ResolveStream();

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.notOk(chunk.link);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});


test('should parse input simple link', (t) => {
  let input = {
    chunk: 'The quick brown :[](animal.md) jumps over the lazy dog./n',
    relativePath: 'test',
    link: {
      primary: {
        href: 'animal.md',
        hrefType: 'file'
      }
    }
  };

  let expected = {
    href: 'test/animal.md',
    hrefType: 'file'
  };

  let testStream = new ResolveStream();

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.same(chunk.link, expected);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});


test('should parse input with overriding link', (t) => {
  let input = {
    chunk: 'The quick brown :[](animal) jumps over the lazy dog./n',
    link: {
      primary: {
        href: 'animal',
        hrefType: 'file'
      },
      references: [
        {
          placeholder: 'animal',
          href: 'fox.md',
          hrefType: 'file'
        },
        {
          placeholder: 'food',
          href: 'cheese.md',
          hrefType: 'file'
        }
      ]
    }
  };

  let expected = {
    href: 'fox.md',
    hrefType: 'file'
  };

  let testStream = new ResolveStream();

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.same(chunk.link, expected);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});


test('should parse input with fallback link', (t) => {
  let input = {
    chunk: 'The quick brown :[](animal) jumps over the lazy dog./n',
    link: {
      primary: {
        href: 'animal',
        hrefType: 'file'
      },
      references: [
        {
          placeholder: 'feline',
          href: 'cat.md',
          hrefType: 'file'
        },
        {
          placeholder: 'food',
          href: 'cheese.md',
          hrefType: 'file'
        }
      ],
      fallback: {
        href: 'fox',
        hrefType: 'string'
      }
    }
  };

  let expected = {
    href: 'fox',
    hrefType: 'string'
  };

  let testStream = new ResolveStream();

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.same(chunk.link, expected);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});
