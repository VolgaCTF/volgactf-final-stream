const config = require('./lib/util/config')
config.load()

const app = require('./lib/app')
const logger = require('./lib/util/logger')
const eventStream = require('./lib/util/event-stream')

function getServerPort () {
  return parseInt(process.env.PORT || '4000', 10)
}

function getServerHost () {
  return process.env.HOST || '0.0.0.0'
}

const server = app.listen(getServerPort(), getServerHost(), function () {
  logger.info(`Worker ${process.pid}, server listening on ${server.address().address}:${server.address().port}`)
  eventStream.run()

  process.on('SIGTERM', function () {
    eventStream.quit()
  })
})
