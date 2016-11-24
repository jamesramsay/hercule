import test from 'ava';
import spigot from 'stream-spigot';
import IndentStream from '../../src/indent-stream';


test.cb('should handle no input', (t) => {
  const testStream = new IndentStream();

  testStream.on('readable', function read() {
    if (this.read() !== null) t.fail();
  });

  testStream.on('end', () => {
    t.pass();
    t.end();
  });

  testStream.end();
});

test.cb('should not modify input without whitespace or newline', (t) => {
  const input = [
    {
      content: 'The quick brown fox ',
    },
    {
      content: 'jumps over ',
      indent: null,
    },
    {
      content: 'the lazy dog.',
      indent: '    ',
    },
  ];
  const testStream = new IndentStream();
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

test.cb('should indent text after each new line', (t) => {
  const input = [
    {
      content: 'The quick\n\nbrown\n',
      indent: '  ',
    },
    {
      content: '\nfox jumps\nover the lazy dog.',
      indent: '  ',
    },
    {
      content: '\n',
      indent: '  ',
    },
  ];
  const expect = [
    {
      content: 'The quick\n\n  brown\n',
      indent: '  ',
    },
    {
      content: '\n  fox jumps\n  over the lazy dog.',
      indent: '  ',
    },
    {
      content: '\n',
      indent: '  ',
    },
  ];
  const testStream = new IndentStream();
  const output = [];

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
