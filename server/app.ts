import path from 'path'

import express from 'express'
import { NotFound } from 'http-errors'

import allRoutes from './routes/all'
import nunjucksSetup from './utils/nunjucksSetup'
import { setUpSentryErrorHandler, setUpSentryRequestHandler } from './utils/sentry'
import errorHandler from './errorHandler'
import type UserService from './services/userService'

import setUpWebSession from './middleware/setUpWebSession'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpAuthentication from './middleware/setUpAuthentication'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import breadcrumbs from './middleware/breadcrumbs'
import { metricsMiddleware } from './monitoring/metricsApp'

export default function createApp(userService: UserService): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  setUpSentryRequestHandler(app)
  app.use(metricsMiddleware)
  app.use(setUpHealthChecks())
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app, path)
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware())
  app.use(breadcrumbs())

  // App routes
  app.use('/', allRoutes(userService))

  setUpSentryErrorHandler(app)
  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
