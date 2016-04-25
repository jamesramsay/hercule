import test from 'ava';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';

import { TranscludeStream } from '../../src/hercule';
import fixtures from '../fixtures';
import './_mock';

_.forEach((fixtures.fixtures), (fixture) => {
  test.cb(`should transclude ${fixture.name}`, (t) => {
    const input = fs.createReadStream(fixture.inputFile, { encoding: 'utf8' });
    const options = { relativePath: path.dirname(fixture.inputFile) };
    const transclude = new TranscludeStream(options, t.context.log);
    const config = fixture.expectedConfig;
    let outputString = '';

    if (fixture.expectedConfig.plan > 0) t.plan(fixture.expectedConfig.plan);
    transclude
      .on('readable', function read() {
        let content = null;
        while ((content = this.read()) !== null) {
          outputString += content;
        }
      })
      .on('error', (err) => {
        // All errors should include a message and path
        t.deepEqual(err.message, config.error.message);
        t.regex(err.path, new RegExp(config.error.path));
      })
      .on('end', () => {
        t.deepEqual(outputString, fixture.expectedOutput);
        t.end();
      });

    input.pipe(transclude);
  });
});
