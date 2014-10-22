async = require 'async'
fs = require 'fs'
path = require 'path'

WHITESPACE_GROUP = 1
FILE_GROUP = 2

substituteParameters = (document, parameters, verbose) ->
  for placeholder, filename of parameters
    if verbose then console.error "Substituting #{placeholder} with #{filename}"

    parameterPlaceholder = new RegExp("{{#{placeholder}}}", "g")
    document = document.replace parameterPlaceholder, "{{#{filename}}}"

  return document


parseParameters = (parameters, verbose) ->
  cb null, null if not parameters

  parsedParameters = {}

  for [placeholder, filename] in (p.split ":" for p in parameters)
    if not filename
      console.error "Malformed parameter #{placeholder}. Expected placeholder:filename"

    else
      parsedParameters[placeholder] = filename

  return parsedParameters


detectDependencies = (document, verbose, cb) ->
  dependencies = {}

  # Detect dependencies and leading whitespace
  # - Whitespace detection: ([^|\n]{1}[\t ]*)?
  #     Locate whitespace from the start of the file or line
  #     if immediately preceeding the dependency.
  # - Dependency detection: ({{(.+?)}})
  #     Dependecies are wrapped in double curly braces.
  detect = new RegExp(/([^|\n]{1}[\t ]*)?{{(.+?)}}/g)

  placeholders = while (dependency = detect.exec document)

    placeholder = dependency[FILE_GROUP]
    whitespace = dependency[WHITESPACE_GROUP]
    [filename, parameters...] = placeholder.split " "

    dependencies[placeholder] =
      filename: filename
      whitespace: whitespace
      parameters: parseParameters parameters, verbose

    placeholder

  cb null, placeholders, dependencies


transclude = (documentPath, parents = [], parameters, verbose, cb) ->
  # Recursively transclude the specified plain text file.
  #
  # documentPath : the name of the file to be transcluded
  # parents      : used for circular dependency checking
  # parameters   : parameterized dependencies

  if verbose then console.error "Transcluding #{documentPath}"

  # Circular dependency checking
  if documentPath in parents then cb "circular dependencies detected"
  parents.push documentPath

  # Read file
  fs.readFile documentPath, (err, document) ->
    if err
      if err.type = 'ENOENT'
        console.error "#{documentPath} not found."
        return cb null, ''
      return cb err

    document = substituteParameters document.toString(), parameters, verbose

    detectDependencies document, verbose, (err, placeholders, dependencies) ->
      if err then return cb err

      if placeholders is []
        return cb null, document

      async.eachSeries placeholders, (placeholder, cb) ->
        dependency = dependencies[placeholder]
        dependencyPath = path.join (path.dirname documentPath), dependency.filename
        transclude dependencyPath, parents[..], dependency.parameters, verbose, (err, output) ->
          if err then return cb err

          if dependency.whitespace
            output = output.replace /\n/g, "\n#{dependency.whitespace}"

          insertionPoint = new RegExp("{{#{placeholder}}}", "g")
          document = document.replace insertionPoint, output

          cb null

      , (err) ->
        cb null, document


module.exports = {
  transclude
  detectDependencies
  parseParameters
  substituteParameters
}
