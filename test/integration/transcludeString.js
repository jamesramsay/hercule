import test from 'ava';
import path from 'path';
import _ from 'lodash';

import { transcludeString } from '../../lib/hercule';
import fixtures from '../fixtures';
import './_mock';


_.forEach((fixtures.fixtures), (fixture) => {
  test.cb(`should transclude ${fixture.name}`, (t) => {
    const options = { relativePath: path.resolve(__dirname, '../fixtures', fixture.name) };
    const config = fixture.expectedConfig;

    // TODO: ava plan
    // if (fixture.expectedConfig.plan > 0) t.plan(fixture.expectedConfig.plan);

    transcludeString(fixture.input, options, (err, output) => {
      if (err) {
        t.same(err.msg, config.error.msg);
        t.regex(err.path, new RegExp(config.error.path));
      } else {
        t.same(err, null);
        t.same(output, fixture.expectedOutput);
      }
      t.end();
    });
  });
});
