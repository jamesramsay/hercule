import test from 'ava';
import nock from 'nock';
import _    from 'lodash';

import hercule from '../lib/hercule';
import fixtures from './fixtures';

_.forEach((fixtures.fixtures), function(fixture) {
  if (fixture.name !== 'invalid-http-link') {
    test('should transclude ' + fixture.name, (t) => {
      const output = hercule.transcludeFileSync(fixture.inputFile);
      t.same(output, fixture.expectedOutput);
    });
  }
});
