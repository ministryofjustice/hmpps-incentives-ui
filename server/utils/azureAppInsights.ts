import { defaultClient, setup, Contracts, DistributedTracingModes, type TelemetryClient } from 'applicationinsights'
import type { EnvelopeTelemetry } from 'applicationinsights/out/Declarations/Contracts'

import config from '../config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContextObject = Record<string, any>

export function initialiseAppInsights(): void {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')

    setup().setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C).start()
  }
}

export function buildAppInsightsClient(): TelemetryClient {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    defaultClient.context.tags['ai.cloud.role'] = config.applicationInfo.applicationName
    defaultClient.context.tags['ai.application.ver'] = config.applicationInfo.buildNumber
    defaultClient.addTelemetryProcessor(ignorePathsProcessor)
    defaultClient.addTelemetryProcessor(addUserDataToRequests)
    return defaultClient
  }
  return null
}

export function addUserDataToRequests(envelope: EnvelopeTelemetry, contextObjects: ContextObject): boolean {
  const isRequest = envelope.data.baseType === Contracts.TelemetryTypeString.Request
  if (isRequest) {
    const { username, activeCaseLoadId } = contextObjects?.['http.ServerRequest']?.res?.locals?.user || {}
    if (username) {
      const { properties } = envelope.data.baseData
      // eslint-disable-next-line no-param-reassign
      envelope.data.baseData.properties = {
        username,
        activeCaseLoadId,
        ...properties,
      }
    }
  }
  return true
}

const prefixesToIgnore = ['GET /ping', 'GET /health', 'GET /metrics']

export function ignorePathsProcessor(envelope: EnvelopeTelemetry): boolean {
  const isRequest = envelope.data.baseType === Contracts.TelemetryTypeString.Request
  if (isRequest) {
    const requestData = envelope.data.baseData
    if (requestData instanceof Contracts.RequestData) {
      const { name } = requestData
      return !prefixesToIgnore.some(prefix => name.startsWith(prefix))
    }
  }
  return true
}
