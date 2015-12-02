import test from 'ava';
import nock from 'nock';
import _ from 'lodash';

import {transcludeFile} from '../lib/hercule';
import fixtures from './fixtures';

nock('http://github.com').get('/size.md').reply(200, 'big\n');

_.forEach((fixtures.fixtures), function(fixture) {
  test.cb(`should transclude ${fixture.name}`, (t) => {
    transcludeFile(fixture.inputFile, {relativePath: `${__dirname}/fixtures/${fixture.name}`}, function(output) {
      t.same(output, fixture.expectedOutput);
      t.end();
    });
  });
});
