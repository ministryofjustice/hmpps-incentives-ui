import type { RequestHandler, Router } from 'express'

import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { featureGate } from '../middleware/featureGate'
import { createRedisClient } from '../data/redisClient'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) =>
    router.get(path, featureGate('addTestErrorEndpoint', asyncMiddleware(handler)))

  get('/', (req, res) => {
    const asyncError = req.query.async === 'true'

    if (asyncError) {
      logger.debug('GET /throw-test-error - throwing delayed async error using setTimeout')
      setTimeout(() => {
        throw new Error('Test async error triggered by GET /throw-test-error')
      }, 200)
    } else {
      logger.debug('GET /throw-test-error - throwing sync Redis error')
      const redisClient = createRedisClient('GET /throw-test-error')
      // connect() not called, will throw `The client is closed` error
      redisClient.ping()
    }
  })

  return router
}
