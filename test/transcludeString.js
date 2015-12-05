import test from 'ava';
import nock from 'nock';
import _ from 'lodash';

import {transcludeString} from '../lib/hercule';
import fixtures from './fixtures';


test.skip('should require a callback function', (t) => {
  const input = 'Jackdaws love my big sphinx of quartz.';
  t.throws(
    () => {
      transcludeString(input, {}, input);
    },
    Error,
    "Argument error: 'callback' should be a function"
  );
});


test.skip('should require a string', (t) => {
  t.throws(
    () => {
      transcludeString(42, function logger() {return true;});
    },
    Error,
    'Argument error: \'input\' should be a string'
  );
});


test.skip('should allow a custom logger to be provided', (t) => {
  const input = 'Jackdaws love my big sphinx of quartz.\n';
  const logOutput = [];

  transcludeString(input, {}, (output) => {
    t.same(output, 'Jackdaws love my big sphinx of quartz.\n');
    t.same(logOutput.length, 2);
    t.end();
  });
});


nock('http://github.com').get('/size.md').reply(200, 'big\n');

_.forEach((fixtures.fixtures), (fixture) => {
  test.cb(`should transclude ${fixture.name}`, (t) => {
    const options = {
      relativePath: `${__dirname}/fixtures/${fixture.name}`,
    };
    transcludeString(fixture.input, options, (output) => {
      t.same(output, fixture.expectedOutput);
      t.end();
    });
  });
});
