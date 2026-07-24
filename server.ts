import './server/utils/azureAppInsights'

import { setImmediate, setInterval } from 'timers'

import config from './server/config'
import { app } from './server/index'
import analyticsPrecacheTables from './server/routes/analyticsPrecacheTables'
import logger from './logger'

app.listen(app.get('port'), () => {
  logger.info(`Server listening on port ${app.get('port')}`)

  if (config.featureFlags.precacheTables) {
    // warm up analytics table cache asynchronously now and once every hour
    setImmediate(analyticsPrecacheTables)
    setInterval(analyticsPrecacheTables, 60 * 60 * 1000)
  }
})
