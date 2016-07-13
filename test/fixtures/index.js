var fs = require('fs');
var path = require('path');

module.exports.fixtures = fs.readdirSync(__dirname).filter(function(file){
  return (file[0] !== '_' && fs.statSync(path.join(__dirname, file)).isDirectory());
}).map(function(file){
  var expectedConfig = {};
  var expectedSourcemap = ''

  try {
    expectedConfig = JSON.parse(fs.readFileSync(__dirname + '/' + file + '/_expect.json', {encoding: 'utf8'}));
  } catch (ex) {
    expectedConfig = {};
  }

  try {
    expectedSourcemap = JSON.parse(fs.readFileSync(__dirname + '/' + file + '/_expect.md.map', {encoding: 'utf8'}));
  } catch (ex) {
    expectedSourcemap = ''
  }

  return {
    name: '' + file,
    inputFile: __dirname + '/' + file + '/index.md',
    inputPath: __dirname + '/' + file,
    input: fs.readFileSync(__dirname + '/' + file + '/index.md', {encoding: 'utf8'}),
    expectedOutput: fs.readFileSync(__dirname + '/' + file + '/_expect.md', {encoding: 'utf8'}),
    expectedConfig: expectedConfig,
    expectedSourcemap: expectedSourcemap
  };
});
