import test from 'ava';
import Get from '../../lib/through2-get';


test.cb('should handle no input', (t) => {
  const get = new Get('content');

  get.on('readable', function read() {
    if (this.read() !== null) t.fail();
  });

  get.on('end', function end() {
    t.pass();
    t.end();
  });

  get.end();
});


test.cb('should not return anything if no matching key', (t) => {
  const input = {
    content: 'The quick brown fox jumps over the lazy dog.',
  };
  const get = new Get('nope');

  get.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.fail();
    }
  });

  get.on('end', function end() {
    t.pass();
    t.end();
  });

  get.write(input);
  get.end();
});


test.cb('should get value of matching key', (t) => {
  const input = {
    content: 'The quick brown fox jumps over the lazy dog.',
  };
  const get = new Get('content');

  get.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      t.same(chunk, input.content);
    }
  });

  get.on('end', function end() {
    t.end();
  });

  get.write(input);
  get.end();
});
