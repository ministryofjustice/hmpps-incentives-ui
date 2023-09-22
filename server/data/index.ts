/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights } from '../utils/azureAppInsights'
import applicationInfo from '../config'

initialiseAppInsights()
// buildAppInsightsClient(applicationInfo)

import HmppsAuthClient from './hmppsAuthClient'
import { createRedisClient } from './redisClient'
import TokenStore from './tokenStore'
import DpsFeComponentsClient from './dpsComponentsClient'

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient: new HmppsAuthClient(new TokenStore(createRedisClient('dpsFrontendComponent'))),
  componentApiClientBuilder: new DpsFeComponentsClient(),
})

export type DataAccess = ReturnType<typeof dataAccess>
