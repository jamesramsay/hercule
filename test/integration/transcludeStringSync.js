import test from 'ava';
import path from 'path';
import _ from 'lodash';

import { transcludeStringSync } from '../../lib/hercule';
import fixtures from '../fixtures';

const [major, minor] = process.versions.node.split('.');

if (major < 1 && minor < 12) {
  // eslint-disable-next-line ava/no-only-test
  test.only('synchronous support not available < 0.12', (t) => {
    t.pass();
  });
}

_.forEach((fixtures.fixtures), (fixture) => {
  // Exclude http tests because mocking won't cover sub-process
  if (_.includes(['http-link', 'http-deep-nesting'], fixture.name)) return;

  test(`should transclude ${fixture.name}`, (t) => {
    const options = { relativePath: path.resolve(__dirname, '../fixtures', fixture.name) };
    const config = fixture.expectedConfig;
    try {
      const output = transcludeStringSync(fixture.input, options);
      t.deepEqual(output, fixture.expectedOutput);
    } catch (ex) {
      if (config.error) {
        t.deepEqual(ex.message, 'Could not transclude input');
      } else {
        t.fail();
      }
    }
  });
});
