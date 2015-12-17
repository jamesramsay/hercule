blanket = require 'blanket' if process.env.COVERAGE

path = require 'path'
_ = require 'lodash'
async = require 'async'
child_process = require 'child_process'

utils = require './utils'


transclude = (input, relativePath, parents, parentRefs, logger, cb) ->
  rawLinks = utils.scan input, relativePath, parents
  links = _.forEach rawLinks, (rawLink) ->
    utils.parse rawLink

  logger.debug "Links found: #{links.length}"
  if links.length < 1 then return cb input

  async.eachSeries links, (link, done) ->
    {href, hrefType, references, parents, whitespace, placeholder} = link

    matchingReferences = parentRefs.filter (ref) -> "#{ref.placeholder}" is "#{href}"
    defaultReference = {href: link.default, hrefType: link.defaultType} if link.default
    overridingReference = matchingReferences[0]

    if overridingReference?
      logger.debug "Overriding reference: #{JSON.stringify overridingReference}"
      href = overridingReference.href
      hrefType = overridingReference.hrefType
    else if defaultReference?
      logger.debug "Fallback reference: #{JSON.stringify defaultReference}"
      href = defaultReference.href
      hrefType = defaultReference.hrefType

    if not overridingReference? and hrefType is "file"
      href = path.join relativePath, href

    if _.contains parents, href
      logger.debug "#{href} is in parents:\n#{JSON.stringify parents}"
      throw new Error("Circular reference detected")

    parents.push href
    dir = path.dirname href
    references = _.unique [references..., parentRefs...], true

    utils.inflate href, hrefType, logger, (content) ->
      logger.debug "Transcluding: #{href} (#{hrefType}) into #{parents[-1..][0]}"
      transclude content, dir, parents, references, logger, (output) ->
        if output?
          # Preserve leading whitespace and trim excess new lines at EOF
          output = output
            .replace /\n/g, "\n#{whitespace}"
            .replace /\n$/, ""

          input = input.replace "#{placeholder}", () -> output
        return done()
  , ->
    return cb input


validateOptionalArgs = ([input, optionalArgs..., cb]) ->
  OPTION_LOGGER = 0
  OPTION_OPTIONS = 1

  defaultOptions =
    relativePath: ""
    parents: []
    parentRefs: []
  logger =
    debug: (message) -> return true,
    error: (message) -> console.error(message)

  if not (typeof cb is 'function')
    throw new Error("Argument error: 'callback' should be a function")

  if not (typeof input is 'string')
    throw new Error("Argument error: 'input' should be a string")

  if typeof optionalArgs[OPTION_LOGGER] is 'function'
    logger.debug = optionalArgs[OPTION_LOGGER]
  else if typeof optionalArgs[OPTION_LOGGER] is 'object'
    logger = optionalArgs[OPTION_LOGGER]

  {relativePath, parents, parentRefs} = _.merge defaultOptions, optionalArgs[OPTION_OPTIONS]

  return {input, relativePath, parents, parentRefs, logger, cb}


# transcludeString(input, [logger], [options], callback)
#
# Arguments:
#  1. input (string): The input string which will be processed for transclusion links
#  2. [log (function)]: Logging function accepting a string as the input
#  3. [options (Object)]: todo
#  4. callback (function): Function returns through the callback
#
# Returns: (string): Transcluded string
transcludeString = (args...) ->
  {input, relativePath, parents, parentRefs, logger, cb} = validateOptionalArgs args

  logger.debug "Transcluding string..."
  transclude input, relativePath, parents, parentRefs, logger, (output) ->
    return cb output


# transcludeFile(input, [logger], [options], callback)
#
# Arguments:
#  1. filepath (string): The location of the local file which will be processed for transclusion links
#  2. [log (function)]: Logging function accepting a string as the input
#  3. [options (Object)]: todo
#  4. callback (function): Function returns through the callback
#
# Returns: (string): Transcluded string
transcludeFile = (args...) ->
  {input, relativePath, parents, parentRefs, logger, cb} = validateOptionalArgs args

  logger.debug "Transcluding file... #{input}"
  fullFilePath = path.join relativePath, input
  fullRelativePath = path.dirname fullFilePath

  parents.push fullFilePath
  content = utils.readFile fullFilePath

  transclude content, fullRelativePath, parents, parentRefs, logger, (output) ->
    return cb output

# transcludeFileSync(input)
#
# Arguments:
#  1. filepath (string): The location of the local file which will be processed for transclusion links
#
# Returns: (string): Transcluded string
transcludeFileSync = (filepath) ->
  return child_process
    .execFileSync '../bin/hercule', [filepath], {cwd: __dirname}
    .toString()
    .replace /\n$/, ""


module.exports = {
  transcludeString,
  transcludeFile,
  transcludeFileSync
}
