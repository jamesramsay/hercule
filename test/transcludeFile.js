import test from 'ava';
import nock from 'nock';
import _    from 'lodash';

import hercule  from '../lib/hercule';
import fixtures from './fixtures';


let mock = nock("http://github.com").get("/size.md").reply(200, "big\n");

_.forEach((fixtures.fixtures), function(fixture) {

  test.cb('should transclude ' + fixture.name, (t) => {
    t.plan(1);
    hercule.transcludeFile(fixture.inputFile, function(output) {
      t.same(output, fixture.expectedOutput)
      t.end();
    });
  });

});
