assert = require 'assert'
hercule = require '../lib/transclude'

describe 'hercule', ->
  describe 'scan', ->
    it 'should not detect non-existant placeholders', (done) ->
      document = "Test document\nwith no placeholders."

      hercule.scan document, "", null, (err, references) ->
        assert.deepEqual references, []

      done()

    it 'should detect placeholders', (done) ->
      document = "Test document\nwith {{one}} placeholder."

      hercule.scan document, "", null, (err, references) ->
        assert.equal references.length, 1

      done()

    it 'should detect multiple placeholders', (done) ->
      document = "Test {{document}}\nwith {{two}} placeholders."

      hercule.scan document, "", null, (err, references) ->
        assert.equal references.length, 2

      done()

    it 'should not detect non-existant leading whitespace', (done) ->
      document = "word{{test.md}}word"

      hercule.scan document, "", null, (err, references) ->
        assert.equal references[0].whitespace, null

      done()

    it 'should detect whitespace on the first line of a file', (done) ->
      document = "\t{{test}}"

      hercule.scan document, "", null, (err, references) ->
        assert.equal references[0].whitespace, "\t"

      done()

    it 'should detect different types of leading whitespace', (done) ->
      document = "# Heading 1\n"
      whitespaceScenarios =
        tab: "\t"
        two: " "
        mixed: "  \t "

      for scenario, whitespace of whitespaceScenarios
        document += "#{whitespace}{{#{scenario}}}\n"

      hercule.scan document, "", null, (err, references) ->
        for reference in references
          assert.equal reference.whitespace, whitespaceScenarios[reference.placeholder]

      done()


  describe 'parse', ->
    it 'should parse a single file reference', (done) ->
      testPlaceholder = "file placeholder:filename.md"
      parsed = hercule.parse testPlaceholder, null, "", null
      assert.deepEqual parsed, {
        file: "file"
        placeholder: testPlaceholder
        overrides: [
          placeholder: "placeholder"
          type: "file"
          value: "filename.md"
        ]
      }

      done()

    it 'should parse a special reference', (done) ->
      testPlaceholder = "file extend:"
      parsed = hercule.parse testPlaceholder, null, "", null
      assert.deepEqual parsed, {
        file: "file"
        placeholder: testPlaceholder
        overrides: [
          placeholder: "extend"
          type: "string"
          value: ""
        ]
      }

      done()

    it 'should parse multiples references', (done) ->
      testPlaceholder = "file fruit:apple.md footer:../common/footer.md copyright:\"Copyright 2014 (c)\""
      dir = "customer/farmers-market"
      parsed = hercule.parse testPlaceholder, null, dir, null
      assert.deepEqual parsed, {
        file: "customer/farmers-market/file"
        placeholder: testPlaceholder
        overrides: [
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

  describe 'apply', ->
    it 'should not change the placeholder when there are no overrides', (done) ->
      placeholder = hercule.apply "file.md", "file.md", []
      assert.equal placeholder, "file.md"

      done()

    it 'should not change the placeholder when there are no matching overrides', (done) ->
      placeholder = hercule.apply "file.md", "file.md", [{placeholder: "footer", type: "file", value: "footer.md"}]
      assert.equal placeholder, "file.md"

      done()

    it 'should change the placeholder when there is a matching override', (done) ->
      placeholder = hercule.apply "test.md", "footer", [{placeholder: "footer", type: "file", value: "footer.md"}]
      assert.equal placeholder, "footer.md"

      done()


  describe 'transclude', ->
    it 'should not change a file without references', (done) ->
      inputFile = __dirname + "/fixtures/test-base/fox.md"

      hercule.transclude inputFile, null, null, false, (err, document) ->
        if err then return cb err
        assert.equal document, 'The quick brown fox jumps over the lazy dog.\n'

        done()

    it 'should not change a file without valid references', (done) ->
      inputFile = __dirname + "/fixtures/test-invalid/fox.md"

      hercule.transclude inputFile, null, null, false, (err, document) ->
        if err then return cb err
        assert.equal document, 'The quick brown fox {{jumps}} over the lazy dog.\n'

        done()

    it 'should transclude files with valid references', (done) ->
      inputFile = __dirname + "/fixtures/test-basic/jackdaw.md"

      hercule.transclude inputFile, null, null, false, (err, document) ->
        if err then return cb err
        assert.equal document, 'Jackdaws love my big sphinx of quartz.\n'

        done()

    it 'should transclude files with valid references and overrides', (done) ->
      inputFile = __dirname + "/fixtures/test-extend/fox.md"

      hercule.transclude inputFile, null, null, false, (err, document) ->
        if err then return cb err
        assert.equal document, "The quick brown fox jumps over the lazy dog.\n"

        done()
