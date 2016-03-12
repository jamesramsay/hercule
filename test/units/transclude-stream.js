import path from 'path';
import test from 'ava';
import TranscludeStream from '../../lib/transclude-stream';


test.cb('should handle no input', (t) => {
  const testStream = new TranscludeStream();

  testStream.on('readable', function read() {
    if (this.read() !== null) t.fail();
  });

  testStream.on('end', () => {
    t.pass();
    t.end();
  });

  testStream.end();
});


test.cb('should read/write string object', (t) => {
  const input = 'Jackdaws love my :[size link](size.md) sphinx of quartz.\n';
  const relativePath = path.join(__dirname, '../fixtures/local-link');
  const testStream = new TranscludeStream({ relativePath });
  const expected = 'Jackdaws love my big sphinx of quartz.\n';
  let output = '';

  testStream.on('readable', function read() {
    let chunk = null;
    while ((chunk = this.read()) !== null) {
      output += chunk;
    }
  });

  testStream.on('end', () => {
    t.same(output, expected);
    t.end();
  });

  testStream.write(input);
  testStream.end();
});
