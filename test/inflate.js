import test  from 'ava';
import utils from '../lib/utils';
import nock  from 'nock';


var logger = {
  error: function() {}
}


test.cb('should return strings', (t) => {
  t.plan(1);
  utils.inflate('dog', 'string', logger, function(output) {
    t.same(output, 'dog');
    t.end();
  });
});


test.cb('should return contents of local files', (t) => {
  t.plan(1);
  let file = __dirname + "/fixtures/basic/index.md";
  utils.inflate(file, 'file', logger, function(output) {
    t.same(output, 'Jackdaws love my :[size link](size.md) sphinx of quartz.\n');
    t.end();
  });
});


test.cb('should return contents of http files', (t) => {
  t.plan(1);
  let url  = "http://github.com";
  let file = "/fox.md";
  let fox  = "The quick brown fox jumps over the lazy dog.\n";

  let mock = nock(url).get(file).reply(200, fox);

  utils.inflate(`${url}${file}`, 'http', logger, function(output) {
    t.same(output, 'The quick brown fox jumps over the lazy dog.\n');
    t.end();
  });
});


test.cb('should return empty string for unsupported types', (t) => {
  t.plan(1);
  utils.inflate('', 'foo', logger, function(output) {
    t.same(output, '');
    t.end();
  });
});
