blanket = require 'blanket' if process.env.COVERAGE

path = require 'path'
_ = require 'lodash'
utils = require './utils'
async = require 'async'

#log = (message) -> console.error "#{message}"

processInput = (input, parents, dir) ->
  rawLinks = utils.scan input
  #log "Scan: #{rawLinks.length} links found"

  links = _.forEach rawLinks, (rawLink) ->
    rawLink.relativePath = dir
    rawLink.parents = parents[..]

    parsedLink = utils.parse rawLink
    #log "Parse: #{parsedLink.references.length} references found"

    return parsedLink

  return links


transclude = (input, relativePath, parents, parentRefs, cb) ->
  # TODO: rename processInput...
  # log "Scanning: #{input}"
  links = processInput input, parents, relativePath
  if links.length < 1 then return cb input

  async.eachSeries links, ({link, type, file, references, parents, whitespace, placeholder}, done) ->
    linkType = type

    references = _.merge parentRefs, references
    match = utils.find link, references

    if match?
      #log "Expanding: #{link} -> #{match.value}"
      link = match.value
      linkType = match.type
    else if linkType is "file"
      link = path.join relativePath, link

    if _.contains parents, link
      # #{link} is in parents:\n#{JSON.stringify parents}
      throw new Error("Circular reference detected")

    #log "Transclude: #{link} into #{parents[-1..][0]}"
    parents.push link
    dir = path.dirname link

    utils.inflate link, linkType, (content) ->

      transclude content, dir, parents, references, (output) ->
        if output?
          # Preserve indentation if transclude is not preceded by content
          # Remove new lines at EOF which cause unexpected paragraphs and breaks
          output = output
            .replace /\n/g, "\n#{whitespace}"
            .replace /\n$/, ""

          input = input.replace "#{placeholder}", output
          #log "Replaced: \"#{placeholder}\"\n    with: #{JSON.stringify output}"
          return done()
  , ->
    return cb input


transcludeString = (input, relativePath = "", parents = [], parentRefs = [], cb) ->
    transclude input, relativePath, parents, parentRefs, (output) ->
      return cb output

transcludeFile = (file, relativePath = "", parents = [], parentRefs = [], cb) ->
    fullFilePath = path.join relativePath, file
    fullRelativePath = path.dirname fullFilePath

    parents.push fullFilePath
    content = utils.readFile fullFilePath

    transclude content, fullRelativePath, parents, parentRefs, (output) ->
      return cb output


module.exports = {transcludeString, transcludeFile}
