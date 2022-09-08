const redis = require('redis')
const logger = require('./logger')

class Subscriber {
  constructor () {
    const host = process.env.REDIS_HOST || '127.0.0.1'
    let port = 6379
    if (process.env.REDIS_PORT) {
      port = parseInt(process.env.REDIS_PORT, 10)
    }
    let database = 0
    if (process.env.VOLGACTF_FINAL_STREAM_REDIS_DB) {
      database = parseInt(process.env.VOLGACTF_FINAL_STREAM_REDIS_DB, 10)
    }

    let password = null
    if (process.env.REDIS_PASSWORD) {
      password = process.env.REDIS_PASSWORD
    }

    this.client = redis.createClient({
      socket: {
        host,
        port
      },
      database,
      password
    })

    this.client.on('connect', function () {
      logger.info('Connecting to Redis...')
    })

    this.client.on('ready', function () {
      logger.info('Connection to Redis has been established')
    })

    this.client.on('reconnecting', function () {
      logger.info('Reconnecting to Redis...')
    })

    this.client.on('end', function () {
      logger.info('Disconnected from Redis')
    })

    this.client.on('error', function (err) {
      logger.error(`Redis connection error: ${err}`)
    })
  }

  async subscribe (channelName, handler) {
    await this.client.connect()
    await this.client.subscribe(channelName, handler)
    logger.info(`Subscribed to Redis channel ${channelName}`)
  }

  async quit () {
    await this.client.quit()
  }
}

module.exports = new Subscriber()
