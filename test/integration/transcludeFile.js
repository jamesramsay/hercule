import test from 'ava';
import path from 'path';
import _ from 'lodash';

import { transcludeFile } from '../../lib/hercule';
import fixtures from '../fixtures';
import './_mock';

_.forEach((fixtures.fixtures), (fixture) => {
  test.cb(`should transclude ${fixture.name}`, (t) => {
    const options = {
      relativePath: path.resolve(__dirname, '../fixtures', fixture.name),
    };

    transcludeFile(fixture.inputFile, options, (output) => {
      t.same(output, fixture.expectedOutput);
      t.end();
    });
  });
});
