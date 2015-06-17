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

# Build the link parser once
grammar = require './grammar'
linkParser = peg.buildParser grammar.transcludeGrammar


logger = (message) ->
  if VERBOSE then console.error message


linksFromInput = (input, dir) ->
  rawLinks = scan input

  links = _.forEach rawLinks, (link) ->
    return link = parse link, dir

  return links


# Parse a link using pegjs
# link: ':[name](path/to/file extendFile:another/file header:"String")'
#  dir: directory of the input containing the link
parse = (link, dir = "") ->
  parsed = linkParser.parse link.placeholder
  logger "Parse: #{parsed.references.length} references found"

  # Links are relative to the document they are declared
  parsed.references.forEach (ref) ->
    ref.value = path.join dir, ref.value if ref.type is "file"

  return _.merge link, parsed


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


# Transclude files
#    input: input string containing transclude links
#      dir: input directory (because links are relative)
# filename: used for circular reference detection
#  parents: list of parents for circular reference detection
transcludeString = (input, dir = "", parents = [], references = [], cb) ->

  links = linksFromInput input, dir
  if links.length < 1 then return cb null, input

  async.eachSeries links, (link, cb) ->
    # Merge references provided in parent with inline references
    # TODO: rename
    linkReferences = _.merge references, link.references
    {file, type} = substitute link.file, linkReferences, dir
    linkDir = path.dirname file

    if file in parents
      return cb "Circular reference detected. #{file} is in parents:\n#{JSON.stringify parents}"

    if type is "string"
      content = file
    else
      content = readFile file

    linkParents = parents[..]
    linkParents.push file

    logger "Transclude: #{file} into #{linkParents[-1..][0]}"

    transcludeString content, linkDir, linkParents, linkReferences, (err, output) ->
      if err then return cb err

      if output?
        # Preserve indentation if transclude is not preceded by content
        output = output.replace /\n/g, "\n#{link.whitespace}"

        # Remove new lines at EOF which cause unexpected paragraphs and breaks
        output = output.replace /\n$/, ""

        input = input.replace "#{link.placeholder}", output
        logger "Replaced: \"#{link.placeholder}\"\n    with: #{JSON.stringify output}"

      cb null

  , (err) ->
    cb err, input


module.exports = {
  transclude
  scan
  parse
  substitute
  readFile
  linksFromInput
  VERBOSE
}
