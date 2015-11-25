import test  from 'ava';
import nock from 'nock';
import InflateStream from '../lib/inflate-stream';


test('should handle no input', (t) => {

  let testStream = new InflateStream();

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

  let testStream = new InflateStream();

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


test('should inflate input with file link', (t) => {
  let input = {
    chunk: ':[Example](size.md)',
    link: {
      href: __dirname + '/fixtures/basic/size.md',
      hrefType: 'file'
    }
  }
  let expected = 'big'

  let testStream = new InflateStream();

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.same(chunk.chunk, expected);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});


test('should skip input with invalid file link', (t) => {
  let input = {
    chunk: ':[Example](size.md)',
    link: {
      href: __dirname + '/i-dont-exist.md',
      hrefType: 'file'
    }
  }
  let expected = ':[Example](size.md)'

  let testStream = new InflateStream();

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.same(chunk.chunk, expected);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});


test('should inflate input with string link', (t) => {
  let input = {
    chunk: ':[Example](size.md)',
    link: {
      href: 'tiny',
      hrefType: 'string'
    }
  }
  let expected = 'tiny'

  let testStream = new InflateStream();

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.same(chunk.chunk, expected);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});


test('should inflate input with http link', (t) => {
  let input = {
    chunk: ':[Example](size.md)',
    link: {
      href: 'http://github.com/size.md',
      hrefType: 'http'
    }
  }
  let expected = 'big'

  let testStream = new InflateStream();

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.same(chunk.chunk, expected);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});


test('should skip input with invalid http link', (t) => {
  let input = {
    chunk: ':[Example](size.md)',
    link: {
      href: 'http://github.com/i-dont-exist.md',
      hrefType: 'http'
    }
  }
  let expected = ':[Example](size.md)'
  let testStream = new InflateStream();
  let mock = nock("http://github.com").get("/size.md").reply(200, "big\n");

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.same(chunk.chunk, expected);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});


test('should not make modifications if hrefType is unrecognised', (t) => {
  let input = {
    chunk: ':[Example](size.md)',
    link: {
      href: 'http://example.com',
      hrefType: 'null'
    }
  }
  let expected = ':[Example](size.md)';
  let testStream = new InflateStream();
  let mock = nock("http://github.com").get("/i-dont-exist.md").reply(404);

  testStream.on('readable', function() {
    var chunk = null;
    while (chunk = this.read()) {
      t.same(chunk.chunk, expected);
    }
  });

  testStream.on('end', function() {
    t.end();
  });

  testStream.write(input)
  testStream.end();

});
