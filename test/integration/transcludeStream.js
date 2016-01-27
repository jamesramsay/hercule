import test from 'ava';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import through2 from 'through2';
import bunyan from 'bunyan';

import { TranscludeStream } from '../../lib/hercule';
import fixtures from '../fixtures';
import './_mock';


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
  test.cb(`should transclude ${fixture.name}`, (t) => {
    const input = fs.createReadStream(fixture.inputFile, { encoding: 'utf8' });
    const options = {
      relativePath: path.dirname(fixture.inputFile),
    };
    const transclude = new TranscludeStream(options, t.context.log);
    let outputString = '';

    transclude.on('readable', function read() {
      let content = null;
      while ((content = this.read()) !== null) {
        outputString += content;
      }
    });

    transclude.on('end', () => {
      t.same(outputString, fixture.expectedOutput);
      t.same(t.context.logOutput, fixture.expectedLogOutput);
      t.end();
    });

    input.pipe(transclude);
  });
});
