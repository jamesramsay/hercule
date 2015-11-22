import test  from 'ava';
import hercule from '../src/hercule-v2';
import through2 from 'through2';
import fs from 'fs';


test('should handle input with no link', (t) => {
  t.plan(1);

  let input = fs.createReadStream(__dirname + '/fixtures/no-link/index.md', {encoding: 'utf8'});
  let expected = fs.readFileSync(__dirname + '/fixtures/no-link/_expect.md', {encoding: 'utf8'});
  let output = '';

  let outputStream = through2.obj(function (chunk, enc, cb) {
    this.push(chunk);
    cb()
  });

  outputStream.on('readable', function () {
    var content = null;
    while (content = this.read()) {
      output += content;
    }
  });

  outputStream.on('end', function () {

    t.same(output, expected);
    t.end();

  })

  let options = {
    relativePath: "",
    parents: "",
    parentRefs: ""
  }

  hercule.transcludeStream(input, null, {}, outputStream);

});

test('should handle input with basic link', (t) => {
  t.plan(1);

  let input = fs.createReadStream(__dirname + '/fixtures/basic/index.md', {encoding: 'utf8'});
  let expected = fs.readFileSync(__dirname + '/fixtures/basic/_expect.md', {encoding: 'utf8'});
  let output = '';

  let outputStream = through2.obj(function (chunk, enc, cb) {
    this.push(chunk);
    cb()
  });

  outputStream.on('readable', function () {
    var content = null;
    while (content = this.read()) {
      output += content;
    }
  });

  outputStream.on('end', function () {

    t.same(output, expected);
    t.end();

  })

  let options = {
    relativePath: "",
    parents: "",
    parentRefs: ""
  }

  hercule.transcludeStream(input, null, {}, outputStream);

});
