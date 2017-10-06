import test from 'ava';
import spigot from 'stream-spigot';
import getStream from 'get-stream';

import Header from '../../src/header';

test.cb('should not modify input without whitespace or newline', t => {
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
  const testStream = new Header();

  spigot({ objectMode: true }, input).pipe(testStream);

  getStream.array(testStream).then(output => {
    t.deepEqual(output, input);
    t.end();
  });
});

test.cb('should add a level for header lines', t => {
  const input = [
    {
      header: 1,
      content: '\n',
    },
    {
      header: 1,
      content: '# Header',
    },
    {
      header: 1,
      content: '  Did gyre and gimble ',
    },
    {
      header: 1,
      content: 'in the wabe:\n',
    },
    {
      header: 1,
      content: 'All mimsy were the borogoves,\n',
    },
    {
      header: 1,
      content: 'And the mome raths outgrabe.\n',
    },
  ];
  const expect = [
    {
      header: 1,
      content: '\n',
    },
    {
      header: 1,
      content: '## Header',
    },
    {
      header: 1,
      content: '  Did gyre and gimble ',
    },
    {
      header: 1,
      content: 'in the wabe:\n',
    },
    {
      header: 1,
      content: 'All mimsy were the borogoves,\n',
    },
    {
      header: 1,
      content: 'And the mome raths outgrabe.\n',
    },
  ];
  const testStream = new Header();

  spigot({ objectMode: true }, input).pipe(testStream);

  getStream.array(testStream).then(output => {
    t.deepEqual(output, expect);
    t.end();
  });
});
