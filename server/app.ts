import express from 'express'

import path from 'path'
import createError from 'http-errors'

import homeRoutes from './routes/home'
import incentivesTableRoutes from './routes/incentivesTable'
import selectLocationRoutes from './routes/selectLocation'
import prisonerImagesRoutes from './routes/prisonerImages'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import standardRouter from './routes/standardRouter'
import type UserService from './services/userService'

import setUpWebSession from './middleware/setUpWebSession'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpAuthentication from './middleware/setUpAuthentication'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import imageRouter from './routes/imageRouter'

export default function createApp(userService: UserService): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(setUpHealthChecks())
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app, path)
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware())

  // App routes
  app.use('/select-location', selectLocationRoutes(standardRouter(userService)))
  app.use('/incentive-summary/:locationPrefix', incentivesTableRoutes(standardRouter(userService)))
  app.use('/prisoner-images/:imageId.jpeg', prisonerImagesRoutes(imageRouter()))
  app.use('/', homeRoutes(standardRouter(userService)))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
