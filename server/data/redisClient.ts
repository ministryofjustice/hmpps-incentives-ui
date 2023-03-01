import { createClient } from 'redis'

import config from '../config'
import logger from '../../logger'

export type RedisClient = ReturnType<typeof createClient>

const url = config.redis.tls_enabled
  ? `rediss://${config.redis.host}:${config.redis.port}`
  : `redis://${config.redis.host}:${config.redis.port}`

export const createRedisClient = (clientName: string): RedisClient => {
  const client = createClient({
    url,
    password: config.redis.password,
    socket: {
      reconnectStrategy: (attempts: number) => {
        // Exponential back off: 20ms, 40ms, 80ms..., capped to retry every 30 seconds
        const nextDelay = Math.min(2 ** attempts * 20, 30000)
        logger.info(`Retry [${clientName}] Redis connection attempt: ${attempts}, next attempt in: ${nextDelay}ms`)
        return nextDelay
      },
    },
  })

  client.on('error', (e: Error) => logger.error(`[${clientName}] Redis error`, e))

  return client
}
