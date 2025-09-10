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

  // Update a value in the session so that redis resets the session TTL.
  // Only changes every minute so that it's not updated with every request.
  // This also has the effect of sending the set-cookie header to the browser
  // which keeps the session alive there, although this is also taken care of
  // by using rolling: true in the configuration above.
  router.use((req, res, next) => {
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3)
    next()
  })

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
