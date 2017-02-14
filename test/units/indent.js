import test from 'ava';
import spigot from 'stream-spigot';
import getStream from 'get-stream';

import Indent from '../../src/indent';

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
  const testStream = new Indent();

  spigot({ objectMode: true }, input).pipe(testStream);

  getStream.array(testStream).then((output) => {
    t.deepEqual(output, input);
    t.end();
  });
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
  const testStream = new Indent();

  spigot({ objectMode: true }, input).pipe(testStream);

  getStream.array(testStream).then((output) => {
    t.deepEqual(output, expect);
    t.end();
  });
});
