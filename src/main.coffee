# Hercule
# A simple markdown transclusion tool
# Author: james ramsay

hercule = require './hercule'
dashdash = require 'dashdash'
fs = require 'fs'
path = require 'path'
async = require 'async'

_VERBOSE = false
_DEBUG = false

parser = dashdash.createParser options: [
  names: ['help', 'h']
  type: 'bool'
  help: 'Print this help and exit.'
,
  names: ['verbose', 'v']
  type: 'arrayOfBool'
  help: 'Verbose output. Use multiple times for more verbose.'
,
  names: ['output', 'o']
  type: 'string'
  help: 'File to output'
  helpArg: 'FILE'
]


try
  opts = parser.parse process.argv
catch e
  console.error "hercule: error: #{e.message}"
  process.exit 1

if opts.help
  help = parser.help({includeEnv: true}).trimRight()
  console.log "usage: hercule [OPTIONS]\noptions:\n#{help}"
  process.exit()

logger = (message) ->
  if _VERBOSE then console.error "#{message}"

main = ->
  transcludedOutput = ""

  if opts.verbose then _VERBOSE = true

  async.eachSeries opts._args, (input, done) ->
    hercule.transcludeFile input, logger, (output) ->
      transcludedOutput += output
      return done()

  , ->
    if opts.output
      fs.writeFile opts.output, transcludedOutput, (err) ->
        throw err if err
    else
      console.log transcludedOutput

main()
