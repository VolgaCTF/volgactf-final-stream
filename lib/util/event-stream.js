const EventEmitter = require('events')
const subscriber = require('./subscriber')

class EventStream extends EventEmitter {
  constructor (maxListeners) {
    super()
    this.setMaxListeners(maxListeners)
  }

  format (id, name, retry, data) {
    const encodedData = JSON.stringify(data)
    return `id: ${id}\nevent: ${name}\nretry: ${retry}\ndata: ${encodedData}\n\n`
  }

  emitMessage (message) {
    const id = message.id
    const name = message.name
    const created = message.created

    if (message.data.internal) {
      this.emit(
        'event:internal',
        this.format(
          id,
          name,
          5000,
          Object.assign(message.data.internal, { __metadataCreated: created })
        )
      )
    }

    if (message.data.teams) {
      this.emit(
        'event:teams',
        this.format(
          id,
          name,
          5000,
          Object.assign(message.data.teams, { __metadataCreated: created })
        )
      )
    }

    if (message.data.external) {
      this.emit(
        'event:external',
        this.format(
          id,
          name,
          5000,
          Object.assign(message.data.external, { __metadataCreated: created })
        )
      )
    }

    if (message.data.team) {
      for (const teamId in message.data.team) {
        const teamData = message.data.team[teamId]
        this.emit(
          `event:team-${teamId}`,
          this.format(
            id,
            name,
            5000,
            Object.assign(teamData, { __metadataCreated: created })
          )
        )
      }
    }
  }

  async run () {
    await subscriber.subscribe(`${process.env.VOLGACTF_FINAL_STREAM_REDIS_CHANNEL_NAMESPACE}:events`, (message, channelName) => {
      this.emitMessage(JSON.parse(message))
    })
  }

  async quit () {
    await subscriber.quit()
  }
}

let maxListeners = 1024
if (process.env.VOLGACTF_FINAL_STREAM_MAX_LISTENERS) {
  maxListeners = parseInt(process.env.VOLGACTF_FINAL_STREAM_MAX_LISTENERS, 10)
}
module.exports = new EventStream(maxListeners)
