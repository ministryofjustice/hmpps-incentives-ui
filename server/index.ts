import promClient from 'prom-client'

import createApp from './app'
import HmppsAuthClient from './data/hmppsAuthClient'
import { createRedisClient } from './data/redisClient'
import TokenStore from './data/tokenStore'
import { createMetricsApp } from './monitoring/metricsApp'
import UserService from './services/userService'

promClient.collectDefaultMetrics()

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient('server/index.ts')))
const userService = new UserService(hmppsAuthClient)

const app = createApp(userService)
const metricsApp = createMetricsApp()

export { app, metricsApp }
