require 'coffee-script/register'
assert = require 'assert-diff'
hercule = require '../src/hercule'
fs = require 'fs'
path = require 'path'

describe 'hercule', ->

  describe 'transcludeString', ->

    it 'should transclude files with valid links', (done) ->
      input = "Jackdaws love my big sphinx of quartz."

      output = hercule.transcludeString input, null, null, null
      assert.equal output, 'Jackdaws love my big sphinx of quartz.'

      done()

    it 'should transclude files with valid links', (done) ->
      file = __dirname + "/fixtures/test-basic/jackdaw.md"
      input = (fs.readFileSync file).toString()
      dir = path.dirname file

      output = hercule.transcludeString input, dir, null, null
      assert.equal output, 'Jackdaws love my big sphinx of quartz.\n'

      done()

  describe 'transcludeFile', ->

    it 'should exit if a circular link exists', (done) ->
      inputFile = __dirname + "/fixtures/test-circular/fox.md"

      assert.throws () ->
        output = hercule.transcludeFile inputFile, null, null, null
      , Error, "Circular reference detected"

      done()

    it 'should not change a file without links', (done) ->
      inputFile = __dirname + "/fixtures/test-base/fox.md"

      output = hercule.transcludeFile inputFile, null, null, null
      assert.equal output, 'The quick brown fox jumps over the lazy dog.\n'

      done()

    it 'should not change a file without valid links', (done) ->
      inputFile = __dirname + "/fixtures/test-invalid/fox.md"

      output = hercule.transcludeFile inputFile, null, null, null
      assert.equal output, 'The quick brown fox {{jumps}} over the lazy dog.\n'

      done()

    it 'should transclude files with valid links', (done) ->
      inputFile = __dirname + "/fixtures/test-basic/jackdaw.md"

      output = hercule.transcludeFile inputFile, null, null, null
      assert.equal output, 'Jackdaws love my big sphinx of quartz.\n'

      done()

    it 'should transclude files with valid links and respect leading whitespace', (done) ->
      inputFile = __dirname + "/fixtures/test-whitespace/jackdaw.md"

      output = hercule.transcludeFile inputFile, null, null, null
      assert.equal output, 'Jackdaws love my\n  big\n  \n    sphinx of quartz.\n'

      done()

    it 'should transclude files with valid links and references', (done) ->
      inputFile = __dirname + "/fixtures/test-extend/fox.md"

      output = hercule.transcludeFile inputFile, null, null, null
      assert.equal output, "The quick brown fox jumps over the lazy dog.\n"

      done()

    it 'should transclude files with valid links, references and string substitutions', (done) ->
      inputFile = __dirname + "/fixtures/test-string-extend/fox.md"

      output = hercule.transcludeFile inputFile, null, null, null
      assert.equal output, "The quick brown fox jumps over the lazy dog.\n"

      done()
