import test from 'ava';

import { transcludeFile } from '../../lib/hercule';
// eslint-disable-next-line ava/no-import-test-files
import fixtures from '../fixtures';
import './_mock';

fixtures.fixtures.forEach(fixture => {
  test.cb(`should transclude ${fixture.name}`, t => {
    const config = fixture.expectedConfig;
    const options = config.options || {};

    transcludeFile(fixture.inputFile, options, (err, output, sourcemap) => {
      if (err) {
        t.regex(err.message, new RegExp(config.error.message));
        t.regex(err.path, new RegExp(config.error.path));
      } else {
        t.is(err, null);
        t.deepEqual(output, fixture.expectedOutput);

        if (fixture.expectedSourcemap) {
          t.deepEqual(sourcemap.mappings, fixture.expectedSourcemap.mappings);
        }
      }
      t.end();
    });
  });
});
