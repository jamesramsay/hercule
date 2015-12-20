import test from 'ava';
import path from 'path';
import nock from 'nock';
import _ from 'lodash';

import {transcludeString} from '../../lib/hercule';
import fixtures from '../fixtures';


nock('http://github.com').get('/size.md').reply(200, 'big\n');

_.forEach((fixtures.fixtures), (fixture) => {
  test.cb(`should transclude ${fixture.name}`, (t) => {
    const options = {
      relativePath: path.resolve(__dirname, '../fixtures', fixture.name),
    };

    transcludeString(fixture.input, options, (output) => {
      t.same(output, fixture.expectedOutput);
      t.end();
    });
  });
});
