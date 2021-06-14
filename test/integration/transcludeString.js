import test from 'ava';

import { transcludeString } from '../../lib/hercule';
// eslint-disable-next-line ava/no-import-test-files
import fixtures from '../fixtures';
import './_mock';

fixtures.fixtures.forEach(fixture => {
  test.cb(`should transclude ${fixture.name}`, t => {
    const config = fixture.expectedConfig;
    const options = config.options || {};
    options.source = fixture.inputFile;

    transcludeString(fixture.input, options, (err, output, sourcemap) => {
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
