import test from 'ava';
import _ from 'lodash';

import {transcludeStringSync} from '../lib/hercule';
import fixtures from './fixtures';


_.forEach((fixtures.fixtures), (fixture) => {
  // Exclude http test because mocking won't cover sync sub-process
  if (fixture.name !== 'http-link') {
    test(`should transclude ${fixture.name}`, (t) => {
      const options = {
        relativePath: `${__dirname}/fixtures/${fixture.name}`,
      };
      const output = transcludeStringSync(fixture.input, options);
      t.same(output, fixture.expectedOutput);
    });
  }
});
