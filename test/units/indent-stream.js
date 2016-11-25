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
      indent: '',
      content: '\n',
    },
    {
      indent: '    ',
      content: '’Twas brillig, and the slithy toves\n',
    },
    {
      indent: '    ',
      content: '  Did gyre and gimble ',
    },
    {
      indent: '    ',
      content: 'in the wabe:\n',
    },
    {
      indent: '    ',
      content: 'All mimsy were the borogoves,\n',
    },
    {
      indent: '      ',
      content: 'And the mome raths outgrabe.\n',
    },
  ];
  const expect = [
    {
      indent: '',
      content: '\n',
    },
    {
      indent: '    ',
      content: '    ’Twas brillig, and the slithy toves\n',
    },
    {
      indent: '    ',
      content: '      Did gyre and gimble ',
    },
    {
      indent: '    ',
      content: 'in the wabe:\n',
    },
    {
      indent: '    ',
      content: '    All mimsy were the borogoves,\n',
    },
    {
      indent: '      ',
      content: '      And the mome raths outgrabe.\n',
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
