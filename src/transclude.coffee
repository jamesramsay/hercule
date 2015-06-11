async = require 'async'
fs = require 'fs'
path = require 'path'
_ = require 'lodash'
peg = require 'pegjs'

VERBOSE = false

# Link detection (including leading whitespace)
linkRegExp = new RegExp(/(^[\t ]*)?(\:\[.*?\]\(.*?\))/gm)
WHITESPACE_GROUP = 1
LINK_GROUP = 2

# Link parser (using pegjs)
grammar = require './grammar'
linkParser = peg.buildParser grammar.transcludeGrammar


parse = (link, dir = "") ->
  parsed = linkParser.parse link.placeholder
  logger "Parse: #{parsed.references.length} references found"

  # Links are relative to the document they are declared
  parsed.references.forEach (ref) ->
    if ref.type is "file"
      ref.value = path.join dir, ref.value

  return _.merge link, parsed


scan = (document) ->
  links = []

  while (match = linkRegExp.exec document)
    links.push {
      placeholder: match[LINK_GROUP]
      whitespace: if match[WHITESPACE_GROUP] then match[WHITESPACE_GROUP] else ""
    }

  logger "Scan: #{links.length} links found"

  return links


readFile = (filename, cb) ->
  fs.readFile filename, (err, document) ->
    if err
      if err.type = 'ENOENT'
        console.error "#{filename} not found."
        return cb null, null

      return cb err

    cb null, document.toString()


expand = (file, references, dir = "") ->
  # :[something](FILE) >> :[something](content.md)
  [p, ...] = _.filter references, (ref) -> return ref?.placeholder is file

  if p?
    logger "Expanding: #{file} >> #{p.value}"
    file = p.value
    type = p.type
  else
    file = path.join dir, file
    type = "file"

  return {file: file, type: type}

logger = (message) ->
  if VERBOSE then console.error message

transclude = (file, dir = "", parents = [], references = [], cb) ->
  {file, type} = expand file, references, dir
  dir = path.dirname file

  if type is "string"
    return cb null, file

  if file in parents
    return cb "Circular reference detected. #{file} is in parents:\n#{JSON.stringify parents}"

  parents.push file
  logger "Transclude: #{file} into #{parents[-1..][0]}"

  readFile file, (err, document) ->
    if err then return cb err

    links = _.forEach (scan document), (link) -> return link = parse link, dir
    if links.length < 1
      return cb null, document

    async.eachSeries links, (link, cb) ->
      link.references = _.merge references, link.references

      transclude link.file, dir, parents[..], link.references, (err, output) ->
        if err then return cb err

        if output?
          # Preserve indentation if transclude is not preceded by content
          output = output.replace /\n/g, "\n#{link.whitespace}"

          # Remove new lines at EOF which cause unexpected paragraphs and breaks
          output = output.replace /\n$/, ""

          document = document.replace "#{link.placeholder}", output
          logger "Replaced: \"#{link.placeholder}\"\n    with: #{JSON.stringify output}"

        cb null

    , (err) ->
      cb err, document


module.exports = {
  transclude
  scan
  parse
  expand
  readFile
  VERBOSE
}
