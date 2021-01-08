const hercule = require('./hercule');

function transcludeString(input, options = {}) {
  return new Promise((resolve, reject) => {
    hercule.transcludeString(input, options, (err, output, sourceMap) => {
      if (err) {
        // eslint-disable-next-line no-param-reassign
        err.sourceMap = sourceMap;
        reject(err);
      }

      resolve({ output, sourceMap });
    });
  });
}

function transcludeFile(input, options = {}) {
  return new Promise((resolve, reject) => {
    hercule.transcludeFile(input, options, (err, output, sourceMap) => {
      if (err) {
        // eslint-disable-next-line no-param-reassign
        err.sourceMap = sourceMap;
        reject(err);
      }

      resolve({ output, sourceMap });
    });
  });
}

module.exports = {
  transcludeString,
  transcludeFile,
  TranscludeStream: hercule.TransculdeSteam,
  resolveHttpUrl: hercule.resolveHttpUrl,
  resolveLocalUrl: hercule.resolveLocalUrl,
  resolveString: hercule.resolveString,
};
