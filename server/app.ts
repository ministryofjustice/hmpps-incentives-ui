import express from 'express'
import { NotFound } from 'http-errors'

import config from './config'
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
import setUpProductInfo from './middleware/setUpProductInfo'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import breadcrumbs from './middleware/breadcrumbs'
import frontendComponents from './middleware/frontendComponents'
import { metricsMiddleware } from './monitoring/metricsApp'

export default function createApp(userService: UserService): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  setUpSentryRequestHandler(app)
  app.use(metricsMiddleware)
  app.use(setUpProductInfo())
  app.use(setUpHealthChecks())
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app)
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware())
  app.use(breadcrumbs())
  app.use(frontendComponents())

  // App routes
  app.use('/', allRoutes(userService))

  setUpSentryErrorHandler(app)
  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(config.production))

  return app
}
