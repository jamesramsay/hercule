async = require 'async'
fs = require 'fs'
path = require 'path'
_ = require 'lodash'
peg = require 'pegjs'

{logger, VERBOSE} = require './log'

# Link detection (including leading whitespace)
linkRegExp = new RegExp(/(^[\t ]*)?(\:\[.*?\]\(.*?\))/gm)
WHITESPACE_GROUP = 1
LINK_GROUP = 2

# Build the link parser once
grammar = require './grammar'
linkParser = peg.buildParser grammar.transcludeGrammar


linksFromInput = (input, parents, dir) ->
  rawLinks = scan input

  links = _.forEach rawLinks, (rawLink) ->
    rawLink.relativePath = dir
    rawLink.parents = parents[..]

    return parse rawLink

  return links


# Parse a link using pegjs
# link: ':[name](path/to/file extendFile:another/file header:"String")'
#  dir: directory of the input containing the link
parse = (rawLink) ->
  parsedLink = linkParser.parse rawLink.placeholder
  logger "Parse: #{parsedLink.references.length} references found"

  # References are relative to the document where declared
  parsedLink.references.forEach (ref) ->
    if ref.type is "file"
      ref.value = path.join rawLink.relativePath, ref.value

  return _.merge rawLink, parsedLink


# Scan a document string for links
scan = (input) ->
  links = []

  while (match = linkRegExp.exec input)
    links.push
      placeholder: match[LINK_GROUP]
      whitespace: if match[WHITESPACE_GROUP] then match[WHITESPACE_GROUP] else ""

  logger "Scan: #{links.length} links found"
  return links


# Read file to string
readFile = (filename) ->
  try
    content = (fs.readFileSync filename).toString()
    return content

  catch err
    if err.code = 'ENOENT'
      logger "#{filename} not found."
    else
      throw err

  return null


# Substitute a placeholder link with the appropriate reference
substitute = (file, references, dir = "") ->
  # :[something](FILE) >> :[something](content.md)
  [p, ...] = _.filter references, (ref) -> return ref?.placeholder is file

  if p?
    logger "Expanding: #{file} >> #{p.value}"
    file = p.value
    type = p.type
  else
    file = path.join dir, file
    type = "file"

  return {file, type}


# File transclude for backwards compatibility
transclude = (file, dir = "", parents = [], references = [], cb) ->
  parents.push file
  dir = path.dirname file
  input = (fs.readFileSync file).toString()

  transcludeString input, dir, parents, references, (err, output) ->
    if (err) then return cb err
    cb err, output


#    input: input string containing transclude links
#      dir: input directory (because links are relative)
# filename: used for circular reference detection
#  parents: list of parents for circular reference detection
transcludeString = (input, relativePath = "", parents = [], parentRefs = [], cb) ->

  links = linksFromInput input, parents, relativePath
  if links.length < 1 then return cb null, input

  async.eachSeries links, ({file, references, parents, whitespace, placeholder}, cb) ->

    references = _.merge parentRefs, references
    substitution = substitute file, references, relativePath

    if substitution.file in parents
      return cb "Circular reference detected. #{file} is in parents:\n#{JSON.stringify parents}"

    if substitution.type is "string"
      content = substitution.file
    else
      content = readFile substitution.file

    parents.push substitution.file
    dir = path.dirname substitution.file

    logger "Transclude: #{substitution.file} into #{parents[-1..][0]}"

    transcludeString content, dir, parents, references, (err, output) ->
      if err then return cb err

      if output?
        # Preserve indentation if transclude is not preceded by content
        output = output.replace /\n/g, "\n#{whitespace}"

        # Remove new lines at EOF which cause unexpected paragraphs and breaks
        output = output.replace /\n$/, ""

        input = input.replace "#{placeholder}", output
        logger "Replaced: \"#{placeholder}\"\n    with: #{JSON.stringify output}"

      cb null

  , (err) ->
    cb err, input


module.exports = {
  transclude
  transcludeString
  scan
  parse
  substitute
  readFile
  linksFromInput
  VERBOSE
}
