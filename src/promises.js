import {
  transcludeString as transcludeStringCb,
  transcludeFile as transcludeFileCb,
} from './hercule';

export {
  TranscludeStream,
  resolveHttpUrl,
  resolveLocalUrl,
  resolveString,
} from './hercule';

export async function transcludeString(input, options = {}) {
  return new Promise((resolve, reject) => {
    transcludeStringCb(input, options, (err, output, sourceMap) => {
      if (err) {
        // eslint-disable-next-line no-param-reassign
        err.sourceMap = sourceMap;
        reject(err);
      }

      resolve({ output, sourceMap });
    });
  });
}

export async function transcludeFile(input, options = {}) {
  return new Promise((resolve, reject) => {
    transcludeFileCb(input, options, (err, output, sourceMap) => {
      if (err) {
        // eslint-disable-next-line no-param-reassign
        err.sourceMap = sourceMap;
        reject(err);
      }

      resolve({ output, sourceMap });
    });
  });
}
