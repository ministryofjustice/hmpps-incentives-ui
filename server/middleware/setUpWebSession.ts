import { randomUUID } from 'node:crypto'

import { RedisStore } from 'connect-redis'
import express, { Router } from 'express'
import session from 'express-session'

import config from '../config'
import logger from '../../logger'
import { createRedisClient } from '../data/redisClient'

export default function setUpWebSession(): Router {
  const client = createRedisClient('middleware/setUpWebSession.ts')
  client.connect().catch((err: Error) => logger.error('Error connecting to [middleware/setUpWebSession.ts] Redis', err))

  const router = express.Router()
  router.use(
    session({
      name: 'hmpps-incentives-ui.session',
      store: new RedisStore({ client }),
      cookie: { secure: config.https, sameSite: 'lax', maxAge: config.session.expiryMinutes * 60 * 1000 },
      secret: config.session.secret,
      resave: false, // redis implements touch so shouldn't need this
      saveUninitialized: false,
      rolling: true,
    }),
  )

  router.use((req, res, next) => {
    const headerName = 'X-Request-Id'
    const oldValue = req.get(headerName)
    const id = oldValue === undefined ? randomUUID() : oldValue

    res.set(headerName, id)
    req.id = id

    next()
  })

  return router
}
