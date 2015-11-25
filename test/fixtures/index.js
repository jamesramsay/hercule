var fs = require('fs');
var path = require('path');

module.exports.fixtures = fs.readdirSync(__dirname).filter(function(file){
	return (file[0] !== '_' && fs.statSync(path.join(__dirname, file)).isDirectory());
}).map(function(file){
	return {
		name: '' + file,
		inputFile: __dirname + '/' + file + '/index.md',
		input: fs.readFileSync(__dirname + '/' + file + '/index.md', {encoding: 'utf8'}),
    expectedOutput: fs.readFileSync(__dirname + '/' + file + '/_expect.md', {encoding: 'utf8'})
	};
});
