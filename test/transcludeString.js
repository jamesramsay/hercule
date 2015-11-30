import test from 'ava';
import nock from 'nock';
import _    from 'lodash';

import hercule  from '../lib/hercule';
import fixtures from './fixtures';


test('should require a callback function', (t) => {
  t.plan(1);
  let input = "Jackdaws love my big sphinx of quartz.";
  t.throws(
    function() { hercule.transcludeString(input, input); },
    Error,
    "Argument error: 'callback' should be a function"
  );
});


test('should require a string', (t) => {
  t.plan(1);
  t.throws(
    function() { hercule.transcludeString(42, function() {}); },
    Error,
    "Argument error: 'input' should be a string"
  );
});


test.cb('should allow a custom logger to be provided', (t) => {
  t.plan(2);
  let input = 'Jackdaws love my big sphinx of quartz.\n'
  let logOutput = []

  let logger = function(message) {
    logOutput.push(message);
  }

  hercule.transcludeString(input, logger, function(output) {
    t.same(output, 'Jackdaws love my big sphinx of quartz.\n');
    t.same(logOutput.length, 2);
    t.end();
  });
});


let mock = nock("http://github.com").get("/size.md").reply(200, "big\n");

_.forEach((fixtures.fixtures), function(fixture) {

  test.cb('should transclude ' + fixture.name, (t) => {
    t.plan(1);
    hercule.transcludeString(fixture.input, function(m) {return;}, {relativePath: __dirname + '/fixtures/' + fixture.name}, function(output) {
      t.same(output, fixture.expectedOutput);
      t.end();
    });
  });

});
