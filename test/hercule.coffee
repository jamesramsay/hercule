require 'coffee-script/register'
assert = require 'assert-diff'
hercule = require '../src/hercule'
fs = require 'fs'
path = require 'path'
nock = require 'nock'

describe 'hercule', ->

  describe 'transcludeString', ->

    it 'should require a callback function', (done) ->
      input = "Jackdaws love my big sphinx of quartz."
      assert.throws () ->
        hercule.transcludeString input, input
      , Error, "Argument error: 'callback' should be a function"
      done()

    it 'should require a string', (done) ->
      assert.throws () ->
        hercule.transcludeString 42, () -> null
      , Error, "Argument error: 'input' should be a string"
      done()

    it 'should allow a custom logger to be provided', (done) ->
      file = __dirname + "/fixtures/test-basic/jackdaw.md"
      input = (fs.readFileSync file).toString()
      dir = path.dirname file
      logOutput = []

      logger = (message) ->
        logOutput.push message

      hercule.transcludeString input, logger, {relativePath: dir}, (output) ->
        assert.equal output, 'Jackdaws love my big sphinx of quartz.\n'
        assert.equal logOutput.length, 4
        done()

    it 'should transclude strings', (done) ->
      input = "Jackdaws love my big sphinx of quartz."

      hercule.transcludeString input, (output) ->
        assert.equal output, 'Jackdaws love my big sphinx of quartz.'
        done()

    it 'should transclude strings with valid links', (done) ->
      file = __dirname + "/fixtures/test-basic/jackdaw.md"
      input = (fs.readFileSync file).toString()
      dir = path.dirname file

      hercule.transcludeString input, null, {relativePath: dir}, (output) ->
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

      hercule.transcludeString input, null, {relativePath: dir}, (output) ->
        assert.equal output, 'Jackdaws love my big sphinx of quartz.\n'
        done()

    it 'should transclude strings with invalid links but a default', (done) ->
      file = __dirname + "/fixtures/test-default/invalid-link.md"
      input = (fs.readFileSync file).toString()
      dir = path.dirname file

      hercule.transcludeString input, null, {relativePath: dir}, (output) ->
        assert.equal output, 'Jackdaws love my imagined sphinx of quartz.\n'
        done()

    it 'should transclude strings with undefined placeholders but a default', (done) ->
      file = __dirname + "/fixtures/test-default/undefined-placeholder.md"
      input = (fs.readFileSync file).toString()
      dir = path.dirname file

      hercule.transcludeString input, null, {relativePath: dir}, (output) ->
        assert.equal output, 'Jackdaws love my imagined sphinx of quartz.\n'
        done()

    it 'should transclude strings with invalid links without hanging', (done) ->
      file = __dirname + "/fixtures/test-default/missing-link.md"
      input = (fs.readFileSync file).toString()
      dir = path.dirname file

      hercule.transcludeString input, null, {relativePath: dir}, (output) ->
        assert.equal output, 'Jackdaws love my :[test link](non-existend-file.md) sphinx of quartz.\n'
        done()


  describe 'transcludeFile', ->

    beforeEach ->
      hercule._VERBOSE = false

    it 'should exit if a circular link exists', (done) ->
      inputFile = __dirname + "/fixtures/test-circular/fox.md"

      assert.throws () ->
        hercule.transcludeFile inputFile, (output) -> return null
      , Error, "Circular reference detected"
      done()

    it 'should not change a file without links', (done) ->
      inputFile = __dirname + "/fixtures/test-base/fox.md"

      hercule.transcludeFile inputFile, (output) ->
        assert.equal output, 'The quick brown fox jumps over the lazy dog.\n'
        done()

    it 'should not change a file without valid links', (done) ->
      inputFile = __dirname + "/fixtures/test-invalid/fox.md"

      hercule.transcludeFile inputFile, (output) ->
        assert.equal output, 'The quick brown fox {{jumps}} over the lazy dog.\n'
        done()

    it 'should transclude files with valid links', (done) ->
      inputFile = __dirname + "/fixtures/test-basic/jackdaw.md"

      hercule.transcludeFile inputFile, (output) ->
        assert.equal output, 'Jackdaws love my big sphinx of quartz.\n'
        done()

    it 'should transclude files with valid links and respect leading whitespace', (done) ->
      inputFile = __dirname + "/fixtures/test-whitespace/jackdaw.md"

      hercule.transcludeFile inputFile, (output) ->
        assert.equal output, 'Jackdaws love my\n  big\n  \n    sphinx of quartz.\n'
        done()

    it 'should transclude files with valid links and references', (done) ->
      inputFile = __dirname + "/fixtures/test-extend/fox.md"

      hercule.transcludeFile inputFile, (output) ->
        assert.equal output, "The quick brown fox jumps over the lazy dog.\n"
        done()

    it 'should transclude files with reference naming collisions', (done) ->
      inputFile = __dirname + "/fixtures/test-reference-collision/index.md"

      hercule.transcludeFile inputFile, (output) ->
        assert.equal output, "The quick brown fox jumps over the lazy dog.\n"
        done()

    it 'should transclude files with parent leakage', (done) ->
      inputFile = __dirname + "/fixtures/test-parent-leakage/index.md"

      hercule.transcludeFile inputFile, (output) ->
        assert.equal output, "The quick brown fox jumps over the lazy dog.\n\nThe quick brown fox jumps over the lazy dog.\n"
        done()

    it 'should transclude files with valid links, references and string substitutions', (done) ->
      inputFile = __dirname + "/fixtures/test-string-extend/fox.md"

      hercule.transcludeFile inputFile, (output) ->
        assert.equal output, "The quick brown fox jumps over the lazy dog.\n"
        done()

    it 'should transclude files with invalid links but a default', (done) ->
      inputFile = __dirname + "/fixtures/test-default/invalid-link.md"

      hercule.transcludeFile inputFile, (output) ->
        assert.equal output, 'Jackdaws love my imagined sphinx of quartz.\n'
        done()

    it 'should transclude files with undefined placeholder but a default', (done) ->
      inputFile = __dirname + "/fixtures/test-default/undefined-placeholder.md"

      hercule.transcludeFile inputFile, (output) ->
        assert.equal output, 'Jackdaws love my imagined sphinx of quartz.\n'
        done()

    it 'should transclude files with escaped quotes within strings', (done) ->
      inputFile = __dirname + "/fixtures/test-quotes/main.md"

      hercule.transcludeFile inputFile, (output) ->
        assert.equal output, """
        ```
        {
          "bar": null
        },
        {
          "bar": "green"
        }
        ```

        """
        done()
