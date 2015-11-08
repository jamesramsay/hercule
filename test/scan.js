import test  from 'ava';
import utils from '../lib/utils';


test('should find zero links when there are none.', (t) => {
  t.plan(1);
  let input = "Test document with no placeholders.";

  let links = utils.scan(input);
  t.same(links, []);
});


test('should find links', (t) => {
  t.plan(4);
  let input = "Test :[document](test/doc.md) with :[number](four.md footer:common/footer.md)\
  :[remote link](http://github.com/example.md) :[placeholders]().";

  let links = utils.scan(input);
  t.same(links[0].placeholder, ":[document](test/doc.md)");
  t.same(links[1].placeholder, ":[number](four.md footer:common/footer.md)");
  t.same(links[2].placeholder, ":[remote link](http://github.com/example.md)");
  t.same(links[3].placeholder, ":[placeholders]()");
});


test('should ignore whitespace between words', (t) => {
  t.plan(1);
  let input = "word :[word](test.md) word";

  let links = utils.scan(input);
  t.same(links[0].whitespace, "");
});


test('should find leading whitespace', (t) => {
  t.plan(3);
  let input = "\t:[](tab)\n\n :[](space) \n  \t :[](mixed)";

  let links = utils.scan(input);
  t.same(links[0].whitespace, "\t");
  t.same(links[1].whitespace, " ");
  t.same(links[2].whitespace, "  \t ");
});
