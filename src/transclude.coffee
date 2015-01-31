async = require 'async'
fs = require 'fs'
path = require 'path'
_ = require 'lodash'

placeholderRegExp = new RegExp(/([\t ]*)?{{(.+?)}}/g)
WHITESPACE_GROUP = 1
PLACEHOLDER_GROUP = 2
EOL_GROUP = 3

parse = (overrideStrings, dir, verbose) ->
  if not overrideStrings then return null

  overrides = []

  for [placeholder, filename] in (o.split ":" for o in overrideStrings)
    override =
      placeholder: placeholder

    if filename isnt ''
      override.file = path.join dir, filename

    overrides.push override

  if verbose and overrides.length > 0
    console.error "     Parse: #{overrides.length} overrides found"

  return overrides


scan = (document, file, verbose, cb) ->
  dir = path.dirname file

  references = []

  while (match = placeholderRegExp.exec document)
    [filename, overrides...] = match[PLACEHOLDER_GROUP].split " "

    ref =
      file: path.join dir, filename
      placeholder: match[PLACEHOLDER_GROUP]
      overrides: parse overrides, dir, verbose
      index: match.index

    if match[WHITESPACE_GROUP]?
      ref.whitespace = match[WHITESPACE_GROUP]

    references.push ref

  if verbose and references.length > 0
    console.error "      Scan: #{references.length} references found"

  cb null, references


readFile = (filename, cb) ->
  fs.readFile filename, (err, document) ->
    if err
      if err.type = 'ENOENT'
        console.error "#{filename} not found."
        return cb null, null

      return cb err

    cb null, document.toString()


apply = (file, placeholder, overrides, verbose) ->
  [p, ...] = _.filter overrides, (o) -> return o?.placeholder is placeholder

  if p?
    if verbose then console.error "  Override: #{placeholder} >> #{p.file}"
    return p.file

  return file


transclude = (file, parents = [], placeholderOverrides = [], verbose, cb) ->
  # Recursively transclude the specified plain text file.
  # file                 : the name of the file to be transcluded
  # parents              : used for circular dependency checking
  # placeholderOverrides : override a placeholder with an alternative dependency {{extend}} -> {{common.md}}

  if verbose
    console.error "Transclude: #{file} into #{parents[-1..][0]}"

  # Simple loop checking
  if file in parents then return cb "Circular reference detected. #{file} is in parents:\n#{JSON.stringify parents}"

  readFile file, (err, document) ->
    if err then return cb err
    #if document is null then return cb null, document

    scan document, file, verbose, (err, references) ->
      if err then return cb err

      # No references, then we're done!
      if references.length < 1 then return cb null, document

      parents.push file

      async.eachSeries references, (reference, cb) ->
        reference.file = apply reference.file, reference.placeholder, placeholderOverrides, verbose
        reference.overrides = _.merge placeholderOverrides, reference.overrides

        transclude reference.file, parents[..], reference.overrides, verbose, (err, output) ->
          if err then return cb err

          if output?
            if reference.whitespace
              # Preserve indentation if transclude is not preceded by content
              output = output.replace /\n/g, "\n#{reference.whitespace}"

            # Remove new lines at EOF which cause unexpected paragraphs and breaks
            output = output.replace /\n $/, ""

            if verbose then console.error "    Output:#{JSON.stringify output}"
            refRegExp = new RegExp("{{#{reference.placeholder}}}", "g")
            document = document.replace refRegExp, output

          cb null

      , (err) ->
        cb null, document


module.exports = {
  transclude
  scan
  parse
  apply
}
