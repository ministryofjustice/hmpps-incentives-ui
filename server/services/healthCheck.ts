import promClient from 'prom-client'

import type { AgentConfig } from '../config'
import config from '../config'
import { serviceCheckFactory } from '../data/healthCheck'

const healthCheckGauge = new promClient.Gauge({
  name: 'upstream_healthcheck',
  help: 'health of an upstream dependency - 1 = healthy, 0 = not healthy',
  labelNames: ['service'],
})

interface HealthCheckStatus {
  name: string
  status: string
  message: unknown
}

interface HealthCheckResult extends Record<string, unknown> {
  healthy: boolean
  checks: Record<string, unknown>
}

export type HealthCheckService = () => Promise<HealthCheckStatus>
export type HealthCheckCallback = (result: HealthCheckResult) => void

function service(name: string, url: string, agentConfig: AgentConfig): HealthCheckService {
  const check = serviceCheckFactory(name, url, agentConfig)
  return () =>
    check()
      .then(result => ({ name, status: 'ok', message: result }))
      .catch(err => ({ name, status: 'ERROR', message: err }))
}

function addAppInfo(result: HealthCheckResult): HealthCheckResult {
  const buildInfo = {
    uptime: process.uptime(),
    build: {
      buildNumber: config.applicationInfo.buildNumber,
      gitRef: config.applicationInfo.gitRef,
    },
    version: config.applicationInfo.buildNumber,
  }

  return { ...result, ...buildInfo }
}

function gatherCheckInfo(aggregateStatus: Record<string, unknown>, currentStatus: HealthCheckStatus) {
  return { ...aggregateStatus, [currentStatus.name]: currentStatus.message }
}

const apiChecks = [
  service('hmppsAuth', `${config.apis.hmppsAuth.url}/health/ping`, config.apis.hmppsAuth.agent),
  service('hmppsPrisonApi', `${config.apis.hmppsPrisonApi.url}/health/ping`, config.apis.hmppsPrisonApi.agent),
  service(
    'hmppsNomisUserRolesApi',
    `${config.apis.nomisUserRolesApi.url}/health/ping`,
    config.apis.nomisUserRolesApi.agent,
  ),
  service(
    'hmppsIncentivesApi',
    `${config.apis.hmppsIncentivesApi.url}/health/ping`,
    config.apis.hmppsIncentivesApi.agent,
  ),
  ...(config.apis.tokenVerification.enabled
    ? [
        service(
          'tokenVerification',
          `${config.apis.tokenVerification.url}/health/ping`,
          config.apis.tokenVerification.agent,
        ),
      ]
    : []),
]

export default function healthCheck(callback: HealthCheckCallback, checks = apiChecks): void {
  Promise.all(checks.map(fn => fn())).then(checkResults => {
    const allOk = checkResults.every(item => item.status === 'ok')

    const result = {
      healthy: allOk,
      checks: checkResults.reduce(gatherCheckInfo, {}),
    }

    checkResults.forEach(item => {
      const val = item.status === 'ok' ? 1 : 0
      healthCheckGauge.labels(item.name).set(val)
    })

    callback(addAppInfo(result))
  })
}
