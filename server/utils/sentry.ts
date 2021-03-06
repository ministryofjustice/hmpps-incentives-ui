import type { Express } from 'express'
import * as Sentry from '@sentry/node'

import config from '../config'
import applicationVersion from '../applicationVersion'

export function initSentry(): void {
  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.environment,
      release: applicationVersion.gitRef,
      debug: config.environment === 'local',
    })
  }
}

export function setUpSentryRequestHandler(app: Express): void {
  if (config.sentry.dsn) {
    app.use(
      Sentry.Handlers.requestHandler({
        include: {
          ip: false,
          user: false,
        },
      }),
    )
  }
}

export function setUpSentryErrorHandler(app: Express): void {
  if (config.sentry.dsn) {
    app.use(Sentry.Handlers.errorHandler())
  }
}
