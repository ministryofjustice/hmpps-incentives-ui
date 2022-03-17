import { createClient } from 'redis'

import config from '../config'
import logger from '../../logger'

export type RedisClient = ReturnType<typeof createClient>

const url = config.redis.tls_enabled
  ? `rediss://${config.redis.host}:${config.redis.port}`
  : `redis://${config.redis.host}:${config.redis.port}`

export const createRedisClient = (clientName: string, legacyMode = false): RedisClient => {
  const client = createClient({
    url,
    password: config.redis.password,
    legacyMode,
  })

  client.on('error', error => {
    logger.error(`[${clientName}] Redis error`, error)
  })

  return client
}
