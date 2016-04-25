import fs from 'fs';
import path from 'path';
import peg from 'pegjs';

let linkGrammar;
let transcludeGrammar;

try {
  linkGrammar = require('./inflate-link'); // eslint-disable-line
  transcludeGrammar = require('./transclusion-link'); // eslint-disable-line
} catch (ex) {
  linkGrammar = peg.buildParser(fs.readFileSync(path.join(__dirname, 'inflate-link.pegjs'), 'utf8'));
  transcludeGrammar = peg.buildParser(fs.readFileSync(path.join(__dirname, 'transclusion-link.pegjs'), 'utf8'));
}

module.exports = {
  linkGrammar,
  transcludeGrammar,
};
