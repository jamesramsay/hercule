import test from 'ava';
import path from 'path';
import _ from 'lodash';
import through2 from 'through2';
import bunyan from 'bunyan';

import { transcludeStringSync } from '../../lib/hercule';
import fixtures from '../fixtures';

let major;
let minor;

[major, minor] = process.versions.node.split('.');

if (major < 1 && minor < 12) {
  test(`synchronous support not available < 0.12`, (t) => {
    t.pass();
  });
} else {
  test.beforeEach((t) => {
    t.context.logOutput = [];
    t.context.logStream = through2.obj();

    t.context.log = bunyan.createLogger({
      name: 'hercule',
      streams: [{
        stream: t.context.logStream,
      }],
    });

    t.context.logStream.on('readable', function read() {
      let message = null;
      while ((message = this.read()) !== null) {
        message = _.pick(JSON.parse(message), 'name', 'msg', 'link', 'level');

        // Make paths relatice to process for testing purposes
        if (message.link && message.link.href) {
          message.link.href = path.relative(process.cwd(), message.link.href);
        }

        t.context.logOutput.push(message);
      }
    });
  });


  _.forEach((fixtures.fixtures), (fixture) => {
    // Exclude http tests because mocking won't cover sub-process
    if (_.contains(['http-link', 'http-deep-nesting'], fixture.name)) return;

    test(`should transclude ${fixture.name}`, (t) => {
      const options = {
        relativePath: path.resolve(__dirname, '../fixtures', fixture.name),
      };
      const output = transcludeStringSync(fixture.input, options, t.context.log);
      t.same(output, fixture.expectedOutput);
      t.same(t.context.logOutput, fixture.expectedLogOutput);
    });
  });
}
