import promClient from 'prom-client'

import createApp from './app'
import ManageUsersApiClient from './data/manageUsersApiClient'
import { createMetricsApp } from './monitoring/metricsApp'
import UserService from './services/userService'

promClient.collectDefaultMetrics()

const manageUsersApiClient = new ManageUsersApiClient()
const userService = new UserService(manageUsersApiClient)

const app = createApp(userService)
const metricsApp = createMetricsApp()

export { app, metricsApp }
