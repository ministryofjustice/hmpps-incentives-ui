/* eslint-disable import/first,import/order */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import 'applicationinsights'
import { initialiseAppInsights, buildAppInsightsClient } from './server/utils/azureAppInsights'

initialiseAppInsights()
buildAppInsightsClient()

import { setImmediate, setInterval } from 'timers'

import config from './server/config'
import { app, metricsApp } from './server/index'
import analyticsPrecacheTables from './server/routes/analyticsPrecacheTables'
import logger from './logger'
import { initSentry } from './server/utils/sentry'

initSentry()

app.listen(app.get('port'), () => {
  logger.info(`Server listening on port ${app.get('port')}`)

  if (config.featureFlags.precacheTables) {
    // warm up analytics table cache asynchronously now and once every hour
    setImmediate(analyticsPrecacheTables)
    setInterval(analyticsPrecacheTables, 60 * 60 * 1000)
  }
})

metricsApp.listen(metricsApp.get('port'), () => {
  logger.info(`Metrics server listening on port ${metricsApp.get('port')}`)
})
