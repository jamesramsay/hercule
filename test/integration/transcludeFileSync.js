import test from 'ava';
import _ from 'lodash';

import { transcludeFileSync } from '../../lib/hercule';
import fixtures from '../fixtures';

const [major, minor] = process.versions.node.split('.');

if (major < 1 && minor < 12) {
  // eslint-disable-next-line ava/no-only-test
  test.only('synchronous support not available < 0.12', (t) => {
    t.pass();
  });
}

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
