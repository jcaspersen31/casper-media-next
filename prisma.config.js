const path = require('node:path')

/** @type {import('prisma').PrismaConfig} */
module.exports = {
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  migrate: {
    adapter: async () => {
      const { PrismaPg } = require('@prisma/adapter-pg')
      const { Pool } = require('pg')
      const pool = new Pool({ connectionString: process.env.DATABASE_URL })
      return new PrismaPg(pool)
    },
  },
}
