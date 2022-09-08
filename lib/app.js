const express = require('express')
const logger = require('./util/logger')
const getRemoteAddr = require('./middleware/addr')
const getIdentity = require('./middleware/identity')
const getLastEventId = require('./middleware/last-event-id')
const { BaseError, UnknownIdentityError } = require('./util/errors')
const eventStream = require('./util/event-stream')
const knex = require('./util/knex')

const app = express()
app.set('trust proxy', true)
app.set('x-powered-by', false)

function writeEvent (response, event, data) {
  response.write(eventStream.format(
    event.id,
    event.name,
    5000,
    Object.assign(data, { __metadataCreated: event.created.toISOString() })
  ))
}

function fetchRecentEvents (request, response, callback) {
  const lastEventId = request.lastEventId

  if (lastEventId != null) {
    knex('server_sent_events')
      .where('id', '>', lastEventId)
      .select('id', 'name', 'created', 'data')
      .then(function (allEvents) {
        allEvents.forEach(function (event) {
          if (request.identity === 'internal' && event.data.internal) {
            writeEvent(response, event, event.data.internal)
          } else if (request.identity === 'teams') {
            if (event.data.teams) {
              writeEvent(response, event, event.data.teams)
            }
            if (event.data.team && Object.prototype.hasOwnProperty.call(event.data.team, request.identityId)) {
              writeEvent(response, event, event.data.team[request.identityId])
            }
          } else if (request.identity === 'external' && event.data.external) {
            writeEvent(response, event, event.data.external)
          }
        })

        callback(null)
      })
      .catch(function (err) {
        callback(err)
      })
  } else {
    callback(null)
  }
}

app.get('/stream', getRemoteAddr, getIdentity, getLastEventId, function (request, response) {
  if (request.identity == null) {
    throw new UnknownIdentityError()
  }

  response.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })
  response.write('\n')

  fetchRecentEvents(request, response, function (err) {
    if (err) {
      throw new BaseError()
    }

    const pushEvent = function (data) {
      response.write(data)
    }

    const channel = `event:${request.identity}`
    let directChannel = null
    if (request.identity === 'teams') {
      directChannel = `event:team-${request.identityId}`
    }

    eventStream.on(channel, pushEvent)
    if (directChannel) {
      eventStream.on(directChannel, pushEvent)
    }

    request.once('close', function () {
      eventStream.removeListener(channel, pushEvent)
      if (directChannel) {
        eventStream.removeListener(directChannel, pushEvent)
      }
    })
  })
})

app.use(function (err, request, response, next) {
  if (err instanceof BaseError) {
    response.status(err.getHttpStatus())
    response.json(err.message)
  } else {
    logger.error(err)
    response.status(500)
    response.json('Internal Server Error')
  }
})

module.exports = app
