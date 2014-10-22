# md-transclude
# author: james ramsay

md = require './transclude'
dashdash = require 'dashdash'
fs = require 'fs'
async = require 'async'

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
  opts = parser.parse process.argv;
catch e
  console.error "md-transclude: error: #{e.message}"
  process.exit 1

if opts.help
  help = parser.help({includeEnv: true}).trimRight()
  console.log "usage: md-transclude [OPTIONS]\noptions:\n#{help}"
  process.exit()

main = ->
  output = ""

  async.eachSeries opts._args, (input, cb) ->
    md.transclude input, null, null, opts.verbose, (err, document) ->
      if err then return cb err
      output += document
      cb null

  , (err) ->
    throw err if err
    if opts.output
      fs.writeFile opts.output, output, (err) ->
        throw err if err
    else
      console.log output

main()
