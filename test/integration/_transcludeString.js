import test from 'ava';
import _ from 'lodash';

import { transcludeString } from '../../src/hercule';
import fixtures from '../fixtures';
import './_mock';

_.forEach(fixtures.fixtures, fixture => {
  test.cb(`should transclude ${fixture.name}`, t => {
    const options = { source: fixture.inputFile };
    const config = fixture.expectedConfig;

    transcludeString(fixture.input, options, (err, output, sourcemap) => {
      if (err) {
        t.regex(err.message, new RegExp(config.error.message));
        t.regex(err.path, new RegExp(config.error.path));
      } else {
        t.deepEqual(err, null);
        t.deepEqual(output, fixture.expectedOutput);

        if (fixture.expectedSourcemap) {
          t.deepEqual(sourcemap.mappings, fixture.expectedSourcemap.mappings);
        }
      }
      t.end();
    });
  });
});
