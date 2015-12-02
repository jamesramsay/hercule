import test from 'ava';
import nock from 'nock';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import through2 from 'through2'

import Transcluder from '../lib/transclude-stream';
import fixtures from './fixtures';


let mock = nock("http://github.com").get("/size.md").reply(200, "big\n");

_.forEach((fixtures.fixtures), function(fixture) {

  test.cb('should transclude ' + fixture.name, (t) => {
    const options = {
      relativePath: path.dirname(fixture.inputFile),
      parents: [],
      parentRefs: []
    };
    let outputString = '';
    let input = fs.createReadStream(fixture.inputFile, {encoding: 'utf8'});
    let transclude = new Transcluder(options);
    let output = through2.obj(function (chunk, enc, cb) {
      this.push(chunk);
      cb();
    });

    t.plan(1);

    output.on('readable', function () {
      var content = null;
      while (content = this.read()) {
        outputString += content;
      }
    });

    output.on('end', function () {
      t.same(outputString, fixture.expectedOutput);
      t.end();
    })
    input.pipe(transclude).pipe(output);


  });

});
