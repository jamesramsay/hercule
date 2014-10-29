assert = require 'assert'
md = require '../lib/transclude'

describe 'markdown transclude', ->
  describe 'detectDependencies', ->
    it 'should whitespace on the first line of a file', ->
      document = "\t{{test}}"
      md.detectDependencies document, null, (err, placeholders, dependencies) ->
        assert.equal dependencies.test.whitespace, "\t"

    it 'should detect different types of whitespace', ->
      document = "# Heading 1\n"
      whitespaceScenarios =
        tab: "\t"
        two: " "
        mixed: "  \t "

      for scenario, whitespace of whitespaceScenarios
        document += "#{whitespace}{{#{scenario}}}\n"

      md.detectDependencies document, null, (err, placeholders, dependencies) ->
        for scenario, whitespace of whitespaceScenarios
          assert.equal dependencies[scenario].whitespace, "#{whitespace}"

  describe 'substituteParameters', ->
    it 'should substitute placeholders with filenames', ->
      document = "# Heading 1\n{{fruit}}\n{{footer}}"
      parameters =
        fruit: "apple.md"
        footer: "common/footer.md"

      md.substituteParameters document, parameters, null, (err, substitutedDocument) ->
        assert.equal substitutedDocument, "# Heading 1\n{{apple.md}}\n{{common/footer.md}}"

  describe 'parseParameters', ->
    it 'should parse parameters', ->
      parameterScenario = ["placeholder:filename.md"]
      expectedParams = placeholder: "filename.md"

      md.parseParameters parameterScenario, null, (err, parsedParameters) ->
        assert.deepEqual parsedParameters, expectedParams

    it 'should parse multiple parameters', ->
      parameterScenario = ["placeholder:filename.md","legal:legal/common.md"]
      expectedParams =
        placeholder: "filename.md"
        legal: "legal/common.md"

      md.parseParameters parameterScenario, null, (err, parsedParameters) ->
        assert.deepEqual parsedParameters, expectedParams
