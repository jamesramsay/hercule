fs = require 'fs'
path = require 'path'
_ = require 'lodash'
request = require 'request'

try
  linkParser = require './transclude-parser'
catch ex
  peg = require 'pegjs'
  linkParser = peg.buildParser (fs.readFileSync './src/transclude.pegjs', {encoding: 'utf8'})


# Link detection (including leading whitespace)
linkRegExp = new RegExp(/(^[\t ]*)?(\:\[.*?\]\((.*?)\))/gm)
WHITESPACE_GROUP = 1
PLACEHOLDER_GROUP = 2
LINK_GROUP = 3


# Scan a document string for links
scan = (input, relativePath = "", parents = []) ->
  links = []
  while (match = linkRegExp.exec input)
    links.push
      placeholder: match[PLACEHOLDER_GROUP]
      href: match[LINK_GROUP]
      whitespace: if match[WHITESPACE_GROUP] then match[WHITESPACE_GROUP] else ""
      relativePath: relativePath
      parents: parents[..]
  return links


# Parse a transclude link
parse = (link) ->
  parsedLink = linkParser.parse link.href
  parsedLink.references.forEach (ref) ->
    if ref.hrefType is "file"
      ref.href = path.join link.relativePath, ref.href
  return _.merge link, parsedLink


# Read file to string
readFile = (filename) ->
  try
    content = (fs.readFileSync filename).toString()
    return content
  catch err
    if err.code is 'ENOENT'
      console.error "Error: File (#{filename}) not found."
  return null


# Read URI contents to string
readUri = (uri, cb) ->
  request uri, (err, res, body) ->
    if (err) or not (res.statusCode is 200)
      console.error "Error: Remote file (#{uri}) could not be retrieved."
      return cb null
    return cb body


inflate = (href, hrefType, cb) ->
  switch hrefType
    when "string"
      return cb href
    when "file"
      content = readFile href
      return cb content
    when "http"
      readUri href, (content) ->
        return cb content
    else
      return cb ""


module.exports = {
  scan
  parse
  readFile
  readUri
  inflate
}
