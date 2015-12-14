import test  from 'ava';
import utils from '../lib/utils';
import nock  from 'nock';


test.beforeEach(t => {
  t.context.logOutput = []
  t.context.logger = {
    error: function(message) {
      t.context.logOutput.push(message);
    }
  }
});


test('readFile should return null for missing files', (t) => {
  t.plan(2);
  let inputFile = __dirname + "/fixtures/i-dont-exist.md";

  let content = utils.readFile('missing.md', t.context.logger);
  t.same(content, null);
  t.same(t.context.logOutput.length, 1);
});


test('readFile should read files which exist', (t) => {
  t.plan(2);
  let inputFile = __dirname + "/fixtures/basic/index.md";

  let content = utils.readFile(inputFile, t.context.logger);
  t.same(content, 'Jackdaws love my :[size link](size.md) sphinx of quartz.\n');
  t.same(t.context.logOutput.length, 0);
});


test.cb('readUri should return null for files not found (404)', (t) => {
  t.plan(2);
  let url  = "http://github.com";
  let file = "/dog.md";

  let mock = nock(url).get(file).reply(404);

  utils.readUri(`${url}${file}`, t.context.logger, function(content) {
    t.same(content, null);
    t.same(t.context.logOutput.length, 1);
    t.end();
  });
});


test.cb('readUri should read http files which exist', (t) => {
  t.plan(2);
  let url  = "http://github.com";
  let file = "/fox.md";
  let fox  = "The quick brown fox jumps over the lazy dog.\n";

  let mock = nock(url).get(file).reply(200, fox);

  utils.readUri(`${url}${file}`, t.context.logger, function(content) {
    t.same(content, 'The quick brown fox jumps over the lazy dog.\n');
    t.same(t.context.logOutput.length, 0);
    t.end();
  });
});
