import express, { Router } from 'express'
import {
  monitoringMiddleware,
  endpointHealthComponent,
  EndpointHealthComponentOptions,
} from '@ministryofjustice/hmpps-monitoring'

import logger from '../../logger'
import config from '../config'

export default function setUpHealthChecks(): Router {
  const router = express.Router()

  const apiConfig = Object.entries(config.apis)
  const { applicationInfo } = config

  const middleware = monitoringMiddleware({
    applicationInfo,
    healthComponents: apiConfig
      .filter(([name, _options]) => name !== 'zendesk')
      .map(([name, options]) => endpointHealthComponent(logger, name, options as EndpointHealthComponentOptions)),
  })

  router.get('/health', middleware.health)
  router.get('/info', middleware.info)
  router.get('/ping', middleware.ping)

  return router
}
