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
        assert.equal references[0].endOfLine, null

      done()

    it 'should detect multiple placeholders', (done) ->
      document = "Test {{document}}\nwith {{two}} placeholders."

      hercule.scan document, "", null, (err, references) ->
        assert.equal references.length, 2
        assert.equal references[0].endOfLine, true
        assert.equal references[1].endOfLine, null

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

    it 'should detect the placeholder index', (done) ->
      document = "{{test}} test\n d {{test2}}"

      hercule.scan document, "", null, (err, references) ->
        assert.equal references[0].index, 0
        assert.equal references[1].index, 16

      done()


  describe 'parse', ->
    it 'should return null if is nothing to parse', (done) ->
      parsed = hercule.parse null, null, null
      assert.equal parsed, null

      done()

    it 'should parse a single reference', (done) ->
      parsed = hercule.parse ["placeholder:filename.md"], "", null
      assert.deepEqual parsed, [{placeholder: "placeholder", file: "filename.md"}]

      done()

    it 'should parse special reference', (done) ->
      parsed = hercule.parse ["extend:"], "", null
      assert.deepEqual parsed, [{placeholder: "extend"}]

      done()

    it 'should parse multiples references', (done) ->
      overrideStrings = [
        "fruit:apple.md"
        "footer:../common/footer.md"
      ]
      dir = "customer/farmers-market"
      expected = [
          placeholder: "fruit"
          file: "customer/farmers-market/apple.md"
        ,
          placeholder: "footer"
          file: "customer/common/footer.md"
        ]

      parsed = hercule.parse overrideStrings, dir, null
      assert.deepEqual parsed, expected

      done()

  describe 'apply', ->
    it 'should not change the placeholder when there are no overrides', (done) ->
      placeholder = hercule.apply "file.md", "file.md", []
      assert.equal placeholder, "file.md"

      done()

    it 'should not change the placeholder when there are no matching overrides', (done) ->
      placeholder = hercule.apply "file.md", "file.md", [{placeholder: "footer", file: "footer.md"}]
      assert.equal placeholder, "file.md"

      done()

    it 'should change the placeholder when there is a matching override', (done) ->
      placeholder = hercule.apply "test.md", "footer", [{placeholder: "footer", file: "footer.md"}]
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
        assert.equal document, "The quick brown fox jumps over the lazy dog\n  .\n"

        done()
