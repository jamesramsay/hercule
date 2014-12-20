assert = require 'assert'
hercule = require '../lib/transclude'

describe 'hercule', ->
  describe 'scan', ->
    it 'should detect whitespace on the first line of a file', ->
      document = "\t{{test}}"
      hercule.scan document, "", null, (err, placeholders, dependencies) ->
        assert.equal dependencies.test.whitespace, "\t"

    it 'should detect different types of leading whitespace', ->
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


  describe 'parse', ->
    it 'should parse references', ->
      parameterScenario = ["placeholder:filename.md"]
      expectedParameters = placeholder: "filename.md"

      hercule.parse parameterScenario, "", null, (err, parsedParameters) ->
        assert.deepEqual parsedParameters, expectedParameters

    it 'should parse multiple references', ->
      parameterScenario = ["placeholder:filename.md","legal:legal/common.md"]
      expectedParameters =
        placeholder: "filename.md"
        legal: "legal/common.md"

      hercule.parse parameterScenario, "", null, (err, parsedParameters) ->
        assert.deepEqual parsedParameters, expectedParameters

    it 'should parse references relative to the parent', ->
      parameterScenario = ["fruit:apple.md","footer:../common/footer.md"]
      documendDirectory = "customer/farmers-market"
      expectedParameters =
        placeholder: "apple.md"
        footer: "common/footer.md"

      hercule.parse parameterScenario, "", null, (err, parsedParameters) ->
        assert.deepEqual parsedParameters, expectedParameters


  describe 'circularReferences', ->
    it 'should not be found when there are no references', ->
      hercule.circularReferences "file.md", null, null, (err) ->
        assert.equal err, null

    it 'should detect circular references', ->
      parents = ["document.md","contents.md","file.md"]

      hercule.circularReferences "file.md", parents, null, (err) ->
        assert.notEqual err, null

    it 'should prevent circular parameterised references', ->
      parents = ["contents.md"]
      parameters =
        header: "header.md"
        footer: "footer.md"
        extend: "file.md"

      hercule.circularReferences "file.md", parents, parameters, (err) ->
        assert.notEqual err, null
