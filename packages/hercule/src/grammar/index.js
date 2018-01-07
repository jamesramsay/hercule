import fs from 'fs';
import path from 'path';

let grammar;

try {
  grammar = require('./link'); // eslint-disable-line
} catch (ex) {
  // Permits using compiling grammar when using ES2015 source
  const peg = require('pegjs'); // eslint-disable-line
  grammar = peg.generate(
    fs.readFileSync(path.join(__dirname, 'link.pegjs'), 'utf8')
  );
}

module.exports = {
  grammar,
};
