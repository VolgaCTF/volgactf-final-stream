const config = require('./lib/util/config')
config.load()

const app = require('./lib/app')
const logger = require('./lib/util/logger')
const eventStream = require('./lib/util/event-stream')
const cluster = require('cluster')

function getNumProcesses () {
  return parseInt(process.env.NUM_PROCESSES || '2', 10)
}

function getServerPort () {
  return parseInt(process.env.PORT || '4000', 10)
}

function getServerHost () {
  return process.env.HOST || '127.0.0.1'
}

if (cluster.isMaster) {
  logger.info(`Master ${process.pid} is running`)

  for (let i = 0; i < getNumProcesses(); i++) {
    cluster.fork()
  }

  cluster.on('online', function (worker) {
    logger.info(`Worker ${worker.process.pid} started`)
  })

  cluster.on('exit', function (worker, code, signal) {
    logger.info(`Worker ${worker.process.pid} died`)
    cluster.fork()
  })
} else {
  const server = app.listen(getServerPort(), getServerHost(), function () {
    logger.info(`Worker ${process.pid}, server listening on ${server.address().address}:${server.address().port}`)
    eventStream.run()

    process.on('SIGTERM', function () {
      eventStream.quit()
    })
  })
}
