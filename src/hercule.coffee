blanket = require 'blanket' if process.env.COVERAGE

path = require 'path'
_ = require 'lodash'
utils = require './utils'

log = (message) -> return

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


transclude = (input, relativePath, parents, parentRefs) ->
  # TODO: rename processInput...
  links = processInput input, parents, relativePath
  if links.length < 1 then return input

  links.forEach ({link, file, references, parents, whitespace, placeholder}) ->
    references = _.merge parentRefs, references
    match = utils.find link, references

    linkType = "file"
    if match?
      #log "Expanding: #{link} -> #{match.value}"
      link = match.value
      linkType = match.type
    else
      link = path.join relativePath, link

    if _.contains parents, link
      # #{link} is in parents:\n#{JSON.stringify parents}
      throw new Error("Circular reference detected")

    #log "Transclude: #{link} into #{parents[-1..][0]}"
    content = utils.inflate link, linkType
    parents.push link
    dir = path.dirname link

    output = transclude content, dir, parents, references

    if output?
      # Preserve indentation if transclude is not preceded by content
      # Remove new lines at EOF which cause unexpected paragraphs and breaks
      output = output
        .replace /\n/g, "\n#{whitespace}"
        .replace /\n$/, ""

      input = input.replace "#{placeholder}", output
      log "Replaced: \"#{placeholder}\"\n    with: #{JSON.stringify output}"

  return input


transcludeString = (input, relativePath = "", parents = [], parentRefs = []) ->
    return transclude input, relativePath, parents, parentRefs

transcludeFile = (file, relativePath = "", parents = [], parentRefs = []) ->
    fullFilePath = path.join relativePath, file
    fullRelativePath = path.dirname fullFilePath

    parents.push fullFilePath
    content = utils.readFile fullFilePath

    return transclude content, fullRelativePath, parents, parentRefs


module.exports = {transcludeString, transcludeFile}
