fs = require 'fs'
path = require 'path'
peg = require 'pegjs'
_ = require 'lodash'
request = require 'request'
deasync = require 'deasync'


# Link detection (including leading whitespace)
linkRegExp = new RegExp(/(^[\t ]*)?(\:\[.*?\]\(.*?\))/gm)
WHITESPACE_GROUP = 1
LINK_GROUP = 2


# Build the link parser once
grammar = require './grammar'
linkParser = peg.buildParser grammar.transcludeGrammar


# Scan a document string for links
scan = (input) ->
  links = []

  while (match = linkRegExp.exec input)
    links.push
      placeholder: match[LINK_GROUP]
      whitespace: if match[WHITESPACE_GROUP] then match[WHITESPACE_GROUP] else ""

  return links


# Parse a transclude link
parse = (rawLink) ->
  parsedLink = linkParser.parse rawLink.placeholder

  # References are relative to the document where declared
  parsedLink.references.forEach (ref) ->
    if ref.type is "file"
      ref.value = path.join rawLink.relativePath, ref.value

  return _.merge rawLink, parsedLink


# Read file to string
readFile = (filename) ->
  try
    validUrlRegex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/
    if validUrlRegex.test(filename)
      done = false
      content = null
      request(filename, (error, response, body) ->
        if !error && response.statusCode == 200
          content = body
          done = true
        else
          done = true
      )
      # makes it non-blocking and synchronous.
      require('deasync').loopWhile( -> !done)
      return content
    else
      return content = (fs.readFileSync filename).toString()

  catch err
    if err.code = 'ENOENT'
      console.error err.message

  return null


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
    else
      return cb ""

module.exports = {
  scan
  parse
  readFile
  find
  inflate
}
