assert = require 'assert'
hercule = require '../lib/transclude'

describe 'hercule', ->
  describe 'scan', ->
    it 'should detect whitespace on the first line of a file', (done) ->
      document = "\t{{test}}"
      hercule.scan document, "", null, (err, placeholders, dependencies) ->
        assert.equal dependencies.test.whitespace, "\t"
        done()

    it 'should detect different types of leading whitespace', (done) ->
      document = "# Heading 1\n"
      whitespaceScenarios =
        tab: "\t"
        two: " "
        mixed: "  \t "

      for scenario, whitespace of whitespaceScenarios
        document += "#{whitespace}{{#{scenario}}}\n"

      hercule.scan document, "", null, (err, placeholders, dependencies) ->
        for scenario, whitespace of whitespaceScenarios
          assert.equal dependencies[scenario].whitespace, "#{whitespace}"
        done()

  describe 'parse', ->

    it 'should parse references', ->
      parameterScenario = ["placeholder:filename.md"]
      expectedParameters = placeholder: "filename.md"

      parsedParameters = hercule.parse parameterScenario, "", null
      assert.deepEqual parsedParameters, expectedParameters

    it 'should parse multiple references', ->
      parameterScenario = ["placeholder:filename.md","legal:legal/common.md"]
      expectedParameters =
        placeholder: "filename.md"
        legal: "legal/common.md"

      parsedParameters = hercule.parse parameterScenario, "", null
      assert.deepEqual parsedParameters, expectedParameters

    it 'should parse references relative to the parent', ->
      parameterScenario = ["fruit:apple.md","footer:../common/footer.md"]
      documendDirectory = "customer/farmers-market"
      expectedParameters =
        fruit: "customer/farmers-market/apple.md"
        footer: "customer/common/footer.md"

      parsedParameters = hercule.parse parameterScenario, documendDirectory, null
      assert.deepEqual parsedParameters, expectedParameters

  describe 'circularReferences', ->
    it 'should not be found when there are no references', (done) ->
      hercule.circularReferences "file.md", null, null, (err) ->
        assert.equal err, null
        done()

    it 'should detect circular references', (done) ->
      parents = ["document.md","contents.md","file.md"]

      hercule.circularReferences "file.md", parents, null, (err) ->
        assert.notEqual err, null
        done()

  describe 'transclude', ->
    it 'should replace {{extend}}', (done) ->
      inputFile = __dirname + "/fixtures/test-extend/index.md"

      hercule.transclude inputFile, null, null, false, (err, document) ->
        if err then return cb err
        assert.equal document, 'bottom\n\n\n'
        done()
