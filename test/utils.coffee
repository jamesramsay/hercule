require 'coffee-script/register'
assert = require 'assert-diff'
utils = require '../src/utils'
nock = require 'nock'

describe 'utils', ->

  describe 'scan', ->
    it 'should find zero links when there are none.', (done) ->
      input = "Test document with no placeholders."

      links = utils.scan input
      assert.deepEqual links, []

      done()

    it 'should find links', (done) ->
      input = """
      Test :[document](test/doc.md) with :[number](four.md footer:common/footer.md)
      :[remote link](http://github.com/example.md) :[placeholders]().
      """

      links = utils.scan input
      assert.equal links[0].placeholder, ":[document](test/doc.md)"
      assert.equal links[1].placeholder, ":[number](four.md footer:common/footer.md)"
      assert.equal links[2].placeholder, ":[remote link](http://github.com/example.md)"
      assert.equal links[3].placeholder, ":[placeholders]()"

      done()

    it 'should ignore whitespace between words', (done) ->
      input = "word :[word](test.md) word"

      links = utils.scan input
      assert.equal links[0].whitespace, ""

      done()

    it 'should find leading whitespace', (done) ->
      input = """\t:[](tab)
      \n :[](space)
        \t :[](mixed)"""

      links = utils.scan input
      assert.equal links[0].whitespace, "\t"
      assert.equal links[1].whitespace, " "
      assert.equal links[2].whitespace, "  \t "

      done()


  describe 'parse', ->
    it 'should parse simple local links', (done) ->
      file = "file.md"
      link =
        link: file
        placeholder: ":[simple](#{file})"
        relativePath: ""

      parsedLink = utils.parse link

      assert.deepEqual parsedLink, {
        link: "file.md"
        type: "file"
        placeholder: link.placeholder
        references: []
        relativePath: ""
      }

      done()

    it 'should parse remote http links', (done) ->
      url = "http://github.com/example.md"
      link =
        link: url
        placeholder: ":[remote http link](#{url})"
        relativePath: ""

      parsedLink = utils.parse link

      assert.deepEqual parsedLink, {
        link: "http://github.com/example.md"
        type: "http"
        placeholder: link.placeholder
        references: []
        relativePath: ""
      }

      done()

    it 'should parse complex links', (done) ->
      mixedLink = "file.md fruit:apple.md header: footer:../common/footer.md copyright:\"Copyright 2014 (c)\""
      link =
        link: mixedLink
        placeholder: ":[](#{mixedLink})"
        relativePath: "customer/farmers-market"

      parsedLink = utils.parse link

      assert.deepEqual parsedLink, {
        link: "file.md"
        type: "file"
        placeholder: link.placeholder
        references: [
          placeholder: "fruit"
          type: "file"
          value: "customer/farmers-market/apple.md"
        ,
          placeholder: "header"
          type: "string"
          value: ""
        ,
          placeholder: "footer"
          type: "file"
          value: "customer/common/footer.md"
        ,
          placeholder:"copyright"
          type:"string"
          value:"Copyright 2014 (c)"
        ]
        relativePath: "customer/farmers-market"
      }

      done()


  describe 'find', ->
    it 'should not find a match when no references provided', (done) ->
      link = "file.md"
      references = []

      match = utils.find link, references
      assert.deepEqual match, undefined

      done()

    it 'should not find a match when there are no matching references', (done) ->
      link = "file.md"
      references = [
        placeholder: "footer"
        type: "file"
        value: "footer.md"
      ]

      match = utils.find link, references
      assert.deepEqual match, undefined

      done()

    it 'should find matching references', (done) ->
      link = "footer"
      type = "file"
      references = [
        placeholder: "footer"
        type: "file"
        value: "common/footer.md"
      ,
        placeholder: "footer"
        type: "file"
        value: "other/footer.md"
      ]

      match = utils.find link, references
      assert.deepEqual match, references[0]

      done()


  describe 'readFile', ->
    it 'should return null for missing files', (done) ->
      inputFile = __dirname + "/fixtures/missing.md"

      content = utils.readFile 'missing.md'
      assert.equal content, null

      done()

    it 'should read files which exist', (done) ->
      inputFile = __dirname + "/fixtures/test-base/fox.md"

      content = utils.readFile inputFile
      assert.equal content, 'The quick brown fox jumps over the lazy dog.\n'

      done()

  describe 'readUri', ->
    it 'should return null for files not found (404)', (done) ->
      url  = "http://github.com"
      file = "/dog.md"

      mock = nock url
        .get file
        .reply 404

      utils.readUri "#{url}#{file}", (content) ->
        assert.equal content, null

        done()

    it 'should read http files which exist', (done) ->
      url  = "http://github.com"
      file = "/fox.md"
      fox  = "The quick brown fox jumps over the lazy dog.\n"

      mock = nock url
        .get file
        .reply 200, fox

      utils.readUri "#{url}#{file}", (content) ->
        assert.equal content, 'The quick brown fox jumps over the lazy dog.\n'

        done()


  describe 'inflate', ->
    it 'should return strings', (done) ->
      utils.inflate 'dog', 'string', (output) ->
        assert.equal output, 'dog'

        done()

    it 'should return contents of local files', (done) ->
      file = __dirname + "/fixtures/test-base/fox.md"
      utils.inflate file, 'file', (output) ->
         assert.equal output, 'The quick brown fox jumps over the lazy dog.\n'

         done()

    it 'should return contents of http files', (done) ->
      url  = "http://github.com"
      file = "/fox.md"
      fox  = "The quick brown fox jumps over the lazy dog.\n"

      mock = nock url
        .get file
        .reply 200, fox

      utils.inflate "#{url}#{file}", 'http', (output) ->
        assert.equal output, 'The quick brown fox jumps over the lazy dog.\n'

        done()

    it 'should return empty string for unsupported types', (done) ->
      utils.inflate '', 'foo', (output) ->
        assert.equal output, ''

        done()
