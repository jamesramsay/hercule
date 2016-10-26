import test from 'ava';
import _ from 'lodash';

import { transcludeFileSync } from '../../src/hercule';
import fixtures from '../fixtures';

_.forEach((fixtures.fixtures), (fixture) => {
  // Exclude http tests because mocking won't cover sync sub-process
  if (_.includes(['http-link', 'http-deep-nesting'], fixture.name)) return;

  test(`should transclude ${fixture.name}`, (t) => {
    const config = fixture.expectedConfig;
    try {
      const output = transcludeFileSync(fixture.inputFile);
      t.deepEqual(output, fixture.expectedOutput);
    } catch (ex) {
      if (config.error) {
        t.deepEqual(ex.message, 'Could not transclude file');
      } else {
        t.fail();
      }
    }
  });
});
