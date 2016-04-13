import _ from 'lodash';
import through2 from 'through2';
import duplexer from 'duplexer2';
import regexpTokenizer from 'regexp-stream-tokenizer';

import ResolveStream from './resolve-stream';
import TrimStream from './trim-stream';
import resolveLink from './inflater';

import { defaultTokenRegExp, defaultToken, defaultSeparator, WHITESPACE_GROUP } from './config';

/**
* Input stream: object
* - link (string, required)
* - relativePath (string, required)
* - parents (array, required)
* - references (array, required)
*
* Output stream: object
* - chunk (string, required)
*
* Input and output properties can be altered by providing options
*/

export default function InflateStream(opt) {
  const options = _.merge({}, opt);

  function inflate(link, relativePath, references, parents, indent) {
    const resolverStream = new ResolveStream();
    const inflaterStream = new InflateStream();
    const trimmerStream = new TrimStream();

    function token(match) {
      return _.merge(
        defaultToken(match, options, indent),
        {
          relativePath,
          references: [...references],
          parents: [link, ...parents],
        }
      );
    }

    function separator(match) {
      return defaultSeparator(match, indent);
    }

    const tokenizerOptions = { leaveBehind: `${WHITESPACE_GROUP}`, source: link, token, separator };
    const linkRegExp = _.get(options, 'linkRegExp') || defaultTokenRegExp;
    const tokenizerStream = regexpTokenizer(tokenizerOptions, linkRegExp);

    trimmerStream.pipe(tokenizerStream).pipe(resolverStream).pipe(inflaterStream);

    return duplexer({ objectMode: true }, trimmerStream, inflaterStream);
  }

  // eslint-disable-next-line consistent-return
  function transform(chunk, encoding, cb) {
    const link = _.get(chunk, 'link');
    const parents = _.get(chunk, 'parents') || [];
    const relativePath = _.get(chunk, 'relativePath') || '';
    const references = _.get(chunk, 'references') || [];
    const indent = _.get(chunk, 'indent') || '';
    const self = this;

    if (!link) {
      this.push(chunk);
      return cb();
    }

    // Resolve link to readable stream
    // eslint-disable-next-line consistent-return
    resolveLink(link, relativePath, (err, input, resolvedLink, resolvedRelativePath) => {
      if (err) {
        this.push(chunk);
        this.emit('error', _.merge({ message: 'Link could not be inflated' }, err));
        return cb();
      }

      if (_.includes(parents, resolvedLink)) {
        this.push(chunk);
        this.emit('error', { message: 'Circular dependency detected', path: link });
        return cb();
      }

      const inflater = inflate(resolvedLink, resolvedRelativePath, references, parents, indent);

      input.on('error', (inputErr) => {
        this.emit('error', _.merge({ message: 'Could not read file' }, inputErr));
        cb();
      });

      inflater.on('readable', function inputReadable() {
        let content;
        while ((content = this.read()) !== null) {
          self.push(content);
        }
      });

      inflater.on('error', (inflateErr) => {
        this.emit('error', inflateErr);
        cb();
      });

      inflater.on('end', () => cb());

      input.pipe(inflater);
    });
  }

  return through2.obj(transform);
}
