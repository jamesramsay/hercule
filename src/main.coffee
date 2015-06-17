# Hercule
# A simple markdown transclusion tool
# Author: james ramsay


blanket = require 'blanket' if process.env.COVERAGE
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
  console.error "hercule: error: #{e.message}"
  process.exit 1

if opts.help
  help = parser.help({includeEnv: true}).trimRight()
  console.log "usage: hercule [OPTIONS]\noptions:\n#{help}"
  process.exit()


main = ->
  md.VERBOSE = opts.verbose
  transcludedOutput = ""

  # Supports multiple input files?
  # e.g. hercule -o output.md file1.md file2.md file3.md
  # Each file will be processed sequentially and appended to output
  async.eachSeries opts._args, (input, cb) ->
    dir = path.dirname input
    input = fs.readFileSync()

    md.transclude input, dir, null, null, (err, output) ->
      if err then return cb err
      transcludedOutput += output
      cb null

  , (err) ->
    throw err if err
    if opts.output
      fs.writeFile opts.output, transcludedOutput, (err) ->
        throw err if err
    else
      console.log output

main()
