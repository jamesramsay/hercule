async = require 'async'
fs = require 'fs'
path = require 'path'
merge = require 'lodash.merge'

WHITESPACE_GROUP = 1
FILE_GROUP = 2

parse = (parameters, dir, verbose) ->
  if not parameters then return null

  parsed = {}

  for [placeholder, filename] in (p.split ":" for p in parameters)
    if not filename
      console.error "Malformed reference #{placeholder}. Expected placeholder:filename"
    else
      parsed[placeholder] = path.join dir, filename

  return parsed


scan = (document, dir, verbose, cb) ->
  references = {}

  # Analyse references and leading whitespace
  # - Whitespace detection: ([^|\n]{1}[\t ]*)?
  #     Locate whitespace from the start of the file or line
  #     if immediately preceeding the reference.
  # - References: ({{(.+?)}})
  #     References are wrapped in double curly braces.

  detect = new RegExp(/([^|\n]{1}[\t ]*)?{{(.+?)}}/g)

  placeholders = while (reference = detect.exec document)

    placeholder = reference[FILE_GROUP]
    whitespace = reference[WHITESPACE_GROUP]
    [filename, parameters...] = placeholder.split " "

    references[placeholder] =
      filepath: path.join dir, filename
      whitespace: whitespace
      parameters: parse parameters, dir, verbose

    placeholder

  cb null, placeholders, references

circularReferences = (file, parents = [], parameters = {}, cb) ->
  # TODO: verbose output
  # a.md -> b.md -> c.md -> d.md -> b.md
  #         ^^^^

  if file in parents
    return cb "Error 1: Circular reference detected. #{file} is in parents:\n#{JSON.stringify parents}"

  cb null


readFile = (filename, cb) ->
  fs.readFile filename, (err, document) ->
    if err
      if err.type = 'ENOENT'
        console.error "#{filename} not found."
        return cb null, ''
      return cb err

    cb null, document.toString()


transclude = (file, parents = [], parameters = {}, verbose, cb) ->
  # Recursively transclude the specified plain text file.
  #
  # file         : the name of the file to be transcluded
  # parents      : used for circular dependency checking
  # parameters   : parameterized dependencies {placeholder: filename, placeholder:filename}

  if verbose then console.error "Transcluding #{file}\n\tparents: #{JSON.stringify parents}\n\tparameters: #{JSON.stringify parameters}"
  relativePath = path.dirname file

  circularReferences file, parents, parameters, (err) ->
    if err then return cb err

  readFile file, (err, document) ->
    if err then return cb err

    scan document, relativePath, verbose, (err, placeholders, dependencies) ->
      if err then return cb err

      if placeholders is [] then return cb null, document

      async.eachSeries placeholders, (placeholder, cb) ->
        dependency = dependencies[placeholder]

        dependencyFilepath = if parameters[placeholder]? then parameters[placeholder] else dependency.filepath
        dependencyParameters = merge parameters, dependency.parameters

        transclude dependencyFilepath, parents.concat([file]), dependencyParameters, verbose, (err, output) ->
          if err then return cb err

          if dependency.whitespace
            output = output.replace /\n/g, "\n#{dependency.whitespace}"

          insertionPoint = new RegExp("{{#{placeholder}}}", "g")
          document = document.replace insertionPoint, output

          cb null

      , (err) ->
        if err then return cb err

        cb null, document


module.exports = {
  transclude
  scan
  parse
  circularReferences
}
