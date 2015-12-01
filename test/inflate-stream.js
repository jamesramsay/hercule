import test  from 'ava';
import nock from 'nock';
import InflateStream from '../lib/inflate-stream';


test.cb('should handle no input', (t) => {
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


test.cb('should skip input without link', (t) => {
  const input = {
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
    t.pass();
    t.end();
  });

  testStream.write(input);
  testStream.end();
});


test.cb('should inflate input with file link', (t) => {
  const input = {
    chunk: ':[Example](size.md)',
    link: {
      href: __dirname + '/fixtures/basic/size.md',
      hrefType: 'file',
    },
  };
  const expected = 'big'
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

  testStream.write(input);
  testStream.end();
});


test.cb('should skip input with invalid file link', (t) => {
  const input = {
    chunk: ':[Example](size.md)',
    link: {
      href: __dirname + '/i-dont-exist.md',
      hrefType: 'file',
    },
  };
  const expected = ':[Example](size.md)';
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

  testStream.write(input);
  testStream.end();
});


test.cb('should inflate input with string link', (t) => {
  const input = {
    chunk: ':[Example](size.md)',
    link: {
      href: 'tiny',
      hrefType: 'string',
    },
  };
  const expected = 'tiny';
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

  testStream.write(input);
  testStream.end();
});


test.cb('should inflate input with http link', (t) => {
  const input = {
    chunk: ':[Example](size.md)',
    link: {
      href: 'http://github.com/size.md',
      hrefType: 'http',
    }
  };
  const expected = 'big';
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

  testStream.write(input);
  testStream.end();
});


test.cb('should skip input with invalid http link', (t) => {
  const input = {
    chunk: ':[Example](size.md)',
    link: {
      href: 'http://github.com/i-dont-exist.md',
      hrefType: 'http',
    },
  };
  const expected = ':[Example](size.md)';
  const mock = nock("http://github.com").get("/size.md").reply(200, "big\n");
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

  testStream.write(input);
  testStream.end();
});


test.cb('should not make modifications if hrefType is unrecognised', (t) => {
  const input = {
    chunk: ':[Example](size.md)',
    link: {
      href: 'http://example.com',
      hrefType: 'null',
    },
  };
  const expected = ':[Example](size.md)';
  const mock = nock("http://github.com").get("/i-dont-exist.md").reply(404);
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

  testStream.write(input);
  testStream.end();
});
