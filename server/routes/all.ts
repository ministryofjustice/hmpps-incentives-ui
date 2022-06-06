import { Router } from 'express'

import type UserService from '../services/userService'
import homeRoutes from './home'
import analyticsRouter from './analyticsRouter'
import throwTestErrorRouter from './throwTestErrorRouter'
import imageRouter from './imageRouter'
import incentivesTableRoutes from './incentivesTable'
import prisonerImagesRoutes from './prisonerImages'
import selectLocationRoutes from './selectLocation'
import standardRouter from './standardRouter'

export default function routes(userService: UserService): Router {
  const router = Router({ mergeParams: true })

  router.use('/select-location', selectLocationRoutes(standardRouter(userService)))
  router.use('/incentive-summary/:locationPrefix', incentivesTableRoutes(standardRouter(userService)))
  router.use('/:prisonId([A-Z0-9]{3,5})?/analytics', analyticsRouter(standardRouter(userService)))
  router.use('/prisoner-images/:imageId.jpeg', prisonerImagesRoutes(imageRouter()))
  router.use('/throw-test-error', throwTestErrorRouter(standardRouter(userService)))
  router.use('/', homeRoutes(standardRouter(userService)))

  return router
}
