fs = require 'fs'
path = require 'path'
peg = require 'pegjs'
_ = require 'lodash'
request = require 'request'


# Link detection (including leading whitespace)
linkRegExp = new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))/gm)
WHITESPACE_GROUP = 1
PLACEHOLDER_GROUP = 2
LINK_GROUP = 3


# Build the link parser once
grammar = require './grammar'
linkParser = peg.buildParser grammar.transcludeGrammar


# Scan a document string for links
scan = (input) ->
  links = []

  while (match = linkRegExp.exec input)
    links.push
      placeholder: match[PLACEHOLDER_GROUP]
      link: match[LINK_GROUP]
      whitespace: if match[WHITESPACE_GROUP] then match[WHITESPACE_GROUP] else ""

  return links


# Parse a transclude link
parse = (rawLink) ->
  parsedLink = linkParser.parse rawLink.link

  # References are relative to the document where declared
  parsedLink.references.forEach (ref) ->
    if ref.type is "file"
      ref.value = path.join rawLink.relativePath, ref.value

  return _.merge rawLink, parsedLink


# Read file to string
readFile = (filename) ->
  try
    content = (fs.readFileSync filename).toString()
    return content

  catch err
    if err.code = 'ENOENT'
      console.error "File (#{filename}) not found."

  return null


# Read URI contents to string
readUri = (link, cb) ->
  request link, (err, res, body) ->
    if (err) or not (res.statusCode is 200)
      console.error "Remote file (#{link}) could not be retrieved."
      return cb null

    return cb body


find = (link, references) ->
  matches = _.filter references, (ref) ->
    return ref?.placeholder is link

  if matches.length > 1
    console.error "Multiple matching references found for #{link}."
    #log.error "Multiple matching references found for #{link}.", {matches}

  return matches[0]


inflate = (link, linkType, cb) ->
  switch linkType
    when "string"
      return cb link
    when "file"
      return cb (readFile link)
    when "http"
      readUri link, (content) -> return cb content
    else
      return cb ""


module.exports = {
  scan
  parse
  readFile
  readUri
  find
  inflate
}
