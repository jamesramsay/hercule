import test from 'ava';
import path from 'path';
import _ from 'lodash';

import { transcludeFile } from '../../src/hercule';
import fixtures from '../fixtures';
import './_mock';

_.forEach((fixtures.fixtures), (fixture) => {
  test.cb(`should transclude ${fixture.name}`, (t) => {
    const options = { relativePath: path.resolve(__dirname, '../fixtures', fixture.name) };
    const config = fixture.expectedConfig;

    transcludeFile(fixture.inputFile, options, (err, output) => {
      if (err) {
        t.deepEqual(err.message, config.error.message);
        t.regex(err.path, new RegExp(config.error.path));
      } else {
        t.deepEqual(err, null);
        t.deepEqual(output, fixture.expectedOutput);
      }
      t.end();
    });
  });
});
