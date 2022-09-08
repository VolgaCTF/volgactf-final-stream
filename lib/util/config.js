const Addr = require('netaddr').Addr

class Config {
  constructor () {
    this.network = {
      internal: [],
      team: []
    }
  }

  load () {
    const internalEntries = (process.env.VOLGACTF_FINAL_NETWORK_INTERNAL || '').split(',').filter(e => !!e)
    const teamEntries = (process.env.VOLGACTF_FINAL_NETWORK_TEAM || '').split(',').filter(e => !!e)

    for (const addr of internalEntries) {
      this.network.internal.push(Addr(addr))
    }

    for (const addr of teamEntries) {
      this.network.team.push(Addr(addr))
    }
  }
}

module.exports = new Config()
