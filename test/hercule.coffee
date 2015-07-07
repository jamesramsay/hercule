require 'coffee-script/register'
assert = require 'assert-diff'
hercule = require '../src/hercule'
fs = require 'fs'
path = require 'path'
nock = require 'nock'

describe 'hercule', ->

  describe 'transcludeString', ->

    it 'should transclude strings', (done) ->
      input = "Jackdaws love my big sphinx of quartz."

      hercule.transcludeString input, null, null, null, (output) ->
        assert.equal output, 'Jackdaws love my big sphinx of quartz.'

        done()

    it 'should transclude strings with valid links', (done) ->
      file = __dirname + "/fixtures/test-basic/jackdaw.md"
      input = (fs.readFileSync file).toString()
      dir = path.dirname file

      hercule.transcludeString input, dir, null, null, (output) ->
        assert.equal output, 'Jackdaws love my big sphinx of quartz.\n'

        done()

    it 'should transclude strings with valid remote http links', (done) ->
      url  = "http://github.com"
      file = "/size.md"
      size  = "big\n"

      mock = nock url
        .get file
        .reply 200, size

      file = __dirname + "/fixtures/test-http/jackdaw.md"
      input = (fs.readFileSync file).toString()
      dir = path.dirname file

      hercule.transcludeString input, dir, null, null, (output) ->
        assert.equal output, 'Jackdaws love my big sphinx of quartz.\n'
        done()

  describe 'transcludeFile', ->

    it 'should exit if a circular link exists', (done) ->
      inputFile = __dirname + "/fixtures/test-circular/fox.md"

      assert.throws () ->
        hercule.transcludeFile inputFile, null, null, null, (output) -> return null
      , Error, "Circular reference detected"

      done()

    it 'should not change a file without links', (done) ->
      inputFile = __dirname + "/fixtures/test-base/fox.md"

      hercule.transcludeFile inputFile, null, null, null, (output) ->
        assert.equal output, 'The quick brown fox jumps over the lazy dog.\n'

        done()

    it 'should not change a file without valid links', (done) ->
      inputFile = __dirname + "/fixtures/test-invalid/fox.md"

      hercule.transcludeFile inputFile, null, null, null, (output) ->
        assert.equal output, 'The quick brown fox {{jumps}} over the lazy dog.\n'

        done()

    it 'should transclude files with valid links', (done) ->
      inputFile = __dirname + "/fixtures/test-basic/jackdaw.md"

      hercule.transcludeFile inputFile, null, null, null, (output) ->
        assert.equal output, 'Jackdaws love my big sphinx of quartz.\n'

        done()

    it 'should transclude files with valid links and respect leading whitespace', (done) ->
      inputFile = __dirname + "/fixtures/test-whitespace/jackdaw.md"

      hercule.transcludeFile inputFile, null, null, null, (output) ->
        assert.equal output, 'Jackdaws love my\n  big\n  \n    sphinx of quartz.\n'

        done()

    it 'should transclude files with valid links and references', (done) ->
      inputFile = __dirname + "/fixtures/test-extend/fox.md"

      hercule.transcludeFile inputFile, null, null, null, (output) ->
        assert.equal output, "The quick brown fox jumps over the lazy dog.\n"

        done()

    it 'should transclude files with valid links, references and string substitutions', (done) ->
      inputFile = __dirname + "/fixtures/test-string-extend/fox.md"

      hercule.transcludeFile inputFile, null, null, null, (output) ->
        assert.equal output, "The quick brown fox jumps over the lazy dog.\n"

        done()
