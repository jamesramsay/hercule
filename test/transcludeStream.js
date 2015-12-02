import test from 'ava';
import nock from 'nock';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import through2 from 'through2';

import Transcluder from '../lib/transclude-stream';
import fixtures from './fixtures';

nock('http://github.com').get('/size.md').reply(200, 'big\n');

_.forEach((fixtures.fixtures), function testFixture(fixture) {
  test.cb(`should transclude ${fixture.name}`, (t) => {
    const options = {
      relativePath: path.dirname(fixture.inputFile),
      parents: [],
      parentRefs: [],
    };
    const input = fs.createReadStream(fixture.inputFile, {encoding: 'utf8'});
    const transclude = new Transcluder(options);
    const output = through2.obj(function transform(chunk, enc, cb) {
      this.push(chunk);
      cb();
    });
    let outputString = '';

    t.plan(1);

    output.on('readable', function read() {
      let content = null;
      while ((content = this.read()) !== null) {
        outputString += content;
      }
    });

    output.on('end', function end() {
      t.same(outputString, fixture.expectedOutput);
      t.end();
    });
    input.pipe(transclude).pipe(output);
  });
});
