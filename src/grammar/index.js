import fs from 'fs';
import path from 'path';

let linkGrammar;
let transcludeGrammar;

try {
  linkGrammar = require('./inflate-link'); // eslint-disable-line
  transcludeGrammar = require('./transclusion-link'); // eslint-disable-line
} catch (ex) {
  // Permits using compiling grammar when using ES2015 source
  const peg = require('pegjs'); // eslint-disable-line
  linkGrammar = peg.generate(fs.readFileSync(path.join(__dirname, 'inflate-link.pegjs'), 'utf8'));
  transcludeGrammar = peg.generate(fs.readFileSync(path.join(__dirname, 'transclusion-link.pegjs'), 'utf8'));
}

module.exports = {
  linkGrammar,
  transcludeGrammar,
};
