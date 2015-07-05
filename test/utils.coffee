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
      input = "Test :[document](test/doc.md) with :[number](three.md footer:common/footer.md) :[placeholders]()."

      links = utils.scan input
      assert.equal links.length, 3

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
    it 'should parse a simple links', (done) ->
      link =
        placeholder: ":[name](file.md)"
        relativePath: ""

      parsedLink = utils.parse link

      assert.deepEqual parsedLink, {
        link: "file.md"
        placeholder: link.placeholder
        references: []
        relativePath: ""
      }

      done()

    it 'should parse complex links', (done) ->
      link =
        placeholder: ":[](file.md fruit:apple.md header: footer:../common/footer.md copyright:\"Copyright 2014 (c)\")"
        relativePath: "customer/farmers-market"

      parsedLink = utils.parse link

      assert.deepEqual parsedLink, {
        link: "file.md"
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

    it 'should read remote file if path is a valid URL', (done) ->
      inputFile = 'http://www.google.com'
      expectedContent = '{ "content": "" }'
      file = nock(inputFile).get('/').reply(200, expectedContent)
      content = utils.readFile inputFile

      assert.equal content, expectedContent

      done()


  describe 'inflate', ->
    it 'should return strings', (done) ->
      utils.inflate 'dog', 'string', (output) ->
        assert.equal output, 'dog'

        done()

    it 'should return contents of files', (done) ->
      file = __dirname + "/fixtures/test-base/fox.md"
      utils.inflate file, 'file', (output) ->
         assert.equal output, 'The quick brown fox jumps over the lazy dog.\n'

         done()

    it 'should return empty string for unsupported types', (done) ->
      utils.inflate '', 'http', (output) ->
        assert.equal output, ''

        done()
