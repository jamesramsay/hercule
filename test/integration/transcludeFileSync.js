import ava from 'ava'; // eslint-disable-line ava/use-test
import _ from 'lodash';

import { transcludeFileSync } from '../../src/hercule';
import fixtures from '../fixtures';

const [major, minor] = process.versions.node.split('.');
const test = (major < 1 && minor < 12) ? ava.skip : ava;

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
