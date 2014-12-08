async = require 'async'
fs = require 'fs'
path = require 'path'

WHITESPACE_GROUP = 1
FILE_GROUP = 2

parseParameters = (parameters, relativePath, verbose) ->
  cb null, null if not parameters

  parsedParameters = {}

  for [placeholder, filename] in (p.split ":" for p in parameters)
    if not filename
      console.error "Malformed parameter #{placeholder}. Expected placeholder:filename"

    else
      parsedParameters[placeholder] = path.join relativePath, filename

  return parsedParameters


detectDependencies = (document, relativePath, verbose, cb) ->
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
      path: path.join relativePath, filename
      whitespace: whitespace
      parameters: parseParameters parameters, relativePath, verbose

    placeholder

  cb null, placeholders, dependencies


# Coffeescript object merge
# gist.github.com/sheldonh/6089299
merge = (xs...) ->
  if xs?.length > 0
    tap {}, (m) -> m[k] = v for k, v of x for x in xs

tap = (o, fn) -> fn(o); o


transclude = (file, parents = [], parameters, verbose, cb) ->
  # Recursively transclude the specified plain text file.
  #
  # file         : the name of the file to be transcluded
  # parents      : used for circular dependency checking
  # parameters   : parameterized dependencies {placeholder: filename, placeholder:filename}

  if verbose then console.error "Transcluding #{file}"
  relativePath = path.dirname file

  # Circular dependency checking
  if file in parents then cb "circular dependencies detected"
  parents.push file

  # Read file
  fs.readFile file, (err, document) ->
    if err
      if err.type = 'ENOENT'
        console.error "#{file} not found."
        return cb null, ''
      return cb err

    document = document.toString()

    detectDependencies document, relativePath, verbose, (err, placeholders, dependencies) ->
      if err then return cb err

      if placeholders is []
        return cb null, document

      async.eachSeries placeholders, (placeholder, cb) ->
        dependency = dependencies[placeholder]

        # Parameter is tried first, otherwise assumed direct file include
        if parameters?[placeholder]?
          dependency.path = parameters[placeholder]

        # Pass parent parameters through. Most recently referenced takes precendence.
        if parameters is not null
          dependency.parameters = merge parameters[..], dependency.parameters[..]

        transclude dependency.path, parents[..], dependency.parameters, verbose, (err, output) ->
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
}
