import test from 'ava';
import _ from 'lodash';

import {transcludeFileSync} from '../lib/hercule';
import fixtures from './fixtures';


_.forEach((fixtures.fixtures), (fixture) => {
  // Exclude http test because mocking won't cover sync sub-process
  if (fixture.name !== 'http-link') {
    test(`should transclude ${fixture.name}`, (t) => {
      const output = transcludeFileSync(fixture.inputFile);
      t.same(output, fixture.expectedOutput);
    });
  }
});
