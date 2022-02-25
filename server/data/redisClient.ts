import { createClient } from 'redis'

import config from '../config'

export type RedisClient = ReturnType<typeof createClient>

const url = config.redis.tls_enabled
  ? `rediss://${config.redis.host}:${config.redis.port}`
  : `redis://${config.redis.host}:${config.redis.port}`

export const createRedisClient = (legacyMode = false): RedisClient => {
  return createClient({
    url,
    password: config.redis.password,
    legacyMode,
  })
}
