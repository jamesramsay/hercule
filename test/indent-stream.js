import test  from 'ava';
import IndentStream from '../src/indent-stream';


test('should find handle empty buffer', (t) => {
  let input = '';

  let testStream = new IndentStream('  ');

  testStream.on('readable', function() {
    var content = null;
    while (content = this.read()) {
      t.fail();
    }
  });

  testStream.on('end', function() {
    t.pass();
    t.end();
  });

  testStream.write(input, 'utf8');
  testStream.end();

});

test('should return objects (transform)', (t) => {
  t.plan(1);
  let input = 'The quick brown\nfox jumps over\nthe lazy dog.';
  let expected = 'The quick brown\n  fox jumps over\n  the lazy dog.';
  let output = ''

  let testStream = new IndentStream('  ');

  testStream.on('readable', function() {
    var content = null;
    while (content = this.read()) {
      output += content;
    }
  });

  testStream.on('end', function() {
    t.same(output, expected)
    t.end();
  });

  input.match(/[^]{1,3}/g)
    .forEach(function(chunk) {
        testStream.write(chunk, 'utf8');
    });

  testStream.end();
  
});
