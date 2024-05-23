import type { AgentConfig } from '../config'
import config from '../config'
import { serviceCheckFactory } from '../data/healthCheck'

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
    productId: config.applicationInfo.productId,
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
  service('manageUsersApi', `${config.apis.manageUsersApi.url}/health/ping`, config.apis.manageUsersApi.agent),
  service(
    'hmppsIncentivesApi',
    `${config.apis.hmppsIncentivesApi.url}/health/ping`,
    config.apis.hmppsIncentivesApi.agent,
  ),
  service('offenderSearchApi', `${config.apis.offenderSearchApi.url}/health/ping`, config.apis.offenderSearchApi.agent),
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

    callback(addAppInfo(result))
  })
}
