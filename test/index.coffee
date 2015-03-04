require 'coffee-script/register'
assert = require 'assert-diff'
hercule = require '../lib/transclude'

# TODO: add circular dependency test
# TODO: add file not found test

describe 'hercule', ->
  describe 'scan', ->
    it 'should not detect non-existant placeholders', (done) ->
      document = "Test document\nwith no placeholders."

      references = hercule.scan document
      assert.deepEqual references, []

      done()

    it 'should detect placeholders', (done) ->
      document = "Test document\nwith :[number](one.md) placeholder."

      references = hercule.scan document
      assert.equal references.length, 1

      done()

    it 'should detect multiple placeholders', (done) ->
      document = "Test :[document](test/doc.md) with :[number](three.md footer:common/footer.md) :[placeholders]()."

      references = hercule.scan document
      assert.equal references.length, 3

      done()

    it 'should not detect non-existant leading whitespace', (done) ->
      document = "word :[word](test.md) word"

      references = hercule.scan document
      assert.equal references[0].whitespace, ""

      done()

    it 'should detect whitespace on the first line of a file', (done) ->
      document = "\t:[](test)"

      references = hercule.scan document
      assert.equal references[0].whitespace, "\t"

      done()

    it 'should detect whitespace on following lines of a file', (done) ->
      document = "\n :[](test)"

      references = hercule.scan document
      assert.equal references[0].whitespace, " "

      done()

    it 'should detect different types of leading whitespace', (done) ->
      document = """# Heading 1
      \t:[](tab)
        :[](space)
        \t :[](mixed)
      """

      references = hercule.scan document
      assert.equal references[0].whitespace, "\t"
      assert.equal references[1].whitespace, "  "
      assert.equal references[2].whitespace, "  \t "

      done()


  describe 'parse', ->
    it 'should parse a single file reference', (done) ->
      reference =
        placeholder: ":[name](file placeholder:filename.md)"

      parsed = hercule.parse reference, ""
      assert.deepEqual parsed, {
        file: "file"
        name: "name"
        placeholder: reference.placeholder
        references: [
          placeholder: "placeholder"
          type: "file"
          value: "filename.md"
        ]
      }

      done()

    it 'should parse a special reference', (done) ->
      reference =
        placeholder: ":[](file extend:)"

      parsed = hercule.parse reference, null
      assert.deepEqual parsed, {
        file: "file"
        name: null
        placeholder: reference.placeholder
        references: [
          placeholder: "extend"
          type: "string"
          value: ""
        ]
      }

      done()

    it 'should parse multiples references', (done) ->
      reference =
        placeholder: ":[](file fruit:apple.md footer:../common/footer.md copyright:\"Copyright 2014 (c)\")"
      dir = "customer/farmers-market"

      parsed = hercule.parse reference, dir
      assert.deepEqual parsed, {
        file: "file"
        name: null
        placeholder: reference.placeholder
        references: [
          placeholder: "fruit"
          type: "file"
          value: "customer/farmers-market/apple.md"
        ,
          placeholder: "footer"
          type: "file"
          value: "customer/common/footer.md"
        ,
          placeholder:"copyright"
          type:"string"
          value:"Copyright 2014 (c)"
        ]
      }

      done()

  describe 'expand', ->
    it 'should not change the link when there are no references', (done) ->
      file = "file.md"

      expandedFile = hercule.expand file, []
      assert.deepEqual expandedFile, file

      done()

    it 'should not change the link when there are no matching references', (done) ->
      file = "file.md"
      references = [
        placeholder: "footer"
        type: "file"
        value: "footer.md"
      ]

      expandedFile = hercule.expand file, references
      assert.deepEqual expandedFile, file

      done()

    it 'should change the link when there is a matching references', (done) ->
      file = "footer"
      references = [
        placeholder: "footer"
        type: "file"
        value: "common/footer.md"
      ]

      expandedFile = hercule.expand file, references
      assert.deepEqual expandedFile, "common/footer.md"

      done()

  describe 'readFile', ->
    it 'should not throw an error for missing files', (done) ->
      inputFile = __dirname + "/fixtures/missing.md"

      hercule.readFile 'missing.md', (err, document) ->
        assert.equal err, null

        done()

    it 'should read files which exist', (done) ->
      inputFile = __dirname + "/fixtures/test-base/fox.md"

      hercule.readFile inputFile, (err, document) ->
        assert.equal document, 'The quick brown fox jumps over the lazy dog.\n'

        done()


  describe 'transclude', ->
    it 'should exit if a circular link exists', (done) ->
      inputFile = __dirname + "/fixtures/test-circular/fox.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        assert.notEqual err, null

        done()

    it 'should not change a file without links', (done) ->
      inputFile = __dirname + "/fixtures/test-base/fox.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        if err then return cb err
        assert.equal document, 'The quick brown fox jumps over the lazy dog.\n'

        done()

    it 'should not change a file without valid links', (done) ->
      inputFile = __dirname + "/fixtures/test-invalid/fox.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        if err then return cb err
        assert.equal document, 'The quick brown fox {{jumps}} over the lazy dog.\n'

        done()

    it 'should transclude files with valid links', (done) ->
      inputFile = __dirname + "/fixtures/test-basic/jackdaw.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        if err then return cb err
        assert.equal document, 'Jackdaws love my big sphinx of quartz.\n'

        done()

    it 'should transclude files with valid links and respect leading whitespace', (done) ->
      inputFile = __dirname + "/fixtures/test-whitespace/jackdaw.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        if err then return cb err
        # TODO: Should there be the extra `\n `?
        assert.equal document, 'Jackdaws love my\n  big\n  \n    sphinx of quartz.\n'

        done()

    it 'should transclude files with valid links and references', (done) ->
      inputFile = __dirname + "/fixtures/test-extend/fox.md"

      hercule.transclude inputFile, null, null, null, (err, document) ->
        if err then return cb err
        assert.equal document, "The quick brown fox jumps over the lazy dog.\n"

        done()
