import test from 'ava';
import _ from 'lodash';
import fs from 'fs';

import { TranscludeStream } from '../../src/hercule';
// eslint-disable-next-line ava/no-import-test-files
import fixtures from '../fixtures';
import './_mock';

_.forEach(fixtures.fixtures, fixture => {
  test.cb(`should transclude ${fixture.name}`, t => {
    const config = fixture.expectedConfig;
    const options = config.options || {};

    // Set output file for sourcemap
    options.outputFile = `${fixture.inputPath}/_expect.md`;

    let outputString = '';
    let sourcemap;
    let errored = 0;

    const input = fs.createReadStream(fixture.inputFile, { encoding: 'utf8' });
    const transclude = new TranscludeStream(input.path, options);

    transclude
      .on('readable', function read() {
        let content = null;
        while ((content = this.read()) !== null) {
          outputString += content;
        }
      })
      .on('error', err => {
        // Error should be emitted no more than once
        t.is(errored, 0);
        errored += 1;

        t.regex(err.message, new RegExp(config.error.message));
        t.regex(err.path, new RegExp(config.error.path));
      })
      .on('sourcemap', outputSourcemap => {
        sourcemap = outputSourcemap;
      })
      .on('end', () => {
        if (!config.error) t.deepEqual(outputString, fixture.expectedOutput);
        if (fixture.expectedSourcemap) {
          t.deepEqual(sourcemap.mappings, fixture.expectedSourcemap.mappings);
          t.deepEqual(sourcemap.sources, fixture.expectedSourcemap.sources);
        }
        t.end();
      });

    input.pipe(transclude);
  });
});
