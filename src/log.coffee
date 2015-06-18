VERBOSE = false

logger = (message) ->
  if VERBOSE then console.error message

module.exports = {
  logger
  VERBOSE
}
