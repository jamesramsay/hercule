import test  from 'ava';
import utils from '../lib/utils';
import nock  from 'nock';


test('readFile should return null for missing files', (t) => {
  t.plan(1);
  let inputFile = __dirname + "/fixtures/i-dont-exist.md";

  let content = utils.readFile('missing.md');
  t.same(content, null);
});


test('readFile should read files which exist', (t) => {
  t.plan(1);
  let inputFile = __dirname + "/fixtures/basic/index.md";

  let content = utils.readFile(inputFile);
  t.same(content, 'Jackdaws love my :[size link](size.md) sphinx of quartz.\n');
});


test.cb('readUri should return null for files not found (404)', (t) => {
  t.plan(1);
  let url  = "http://github.com";
  let file = "/dog.md";

  let mock = nock(url).get(file).reply(404);

  utils.readUri(`${url}${file}`, function(content) {
    t.same(content, null);
    t.end();
  });
});


test.cb('readUri should read http files which exist', (t) => {
  t.plan(1);
  let url  = "http://github.com";
  let file = "/fox.md";
  let fox  = "The quick brown fox jumps over the lazy dog.\n";

  let mock = nock(url).get(file).reply(200, fox);

  utils.readUri(`${url}${file}`, function(content) {
    t.same(content, 'The quick brown fox jumps over the lazy dog.\n');
    t.end();
  });
});
