const knex = require('knex')

module.exports = knex({
  client: 'pg',
  connection: {
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT, 10),
    user: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
  },
  pool: {
    min: 0,
    max: 10
  }
})
