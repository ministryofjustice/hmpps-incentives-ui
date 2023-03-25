import { Router } from 'express'

import config from '../config'
import { userActiveCaseloadMatches, environmentGate } from '../middleware/featureGate'
import type UserService from '../services/userService'
import homeRoutes from './home'
import analyticsRouter from './analyticsRouter'
import throwTestErrorRouter from './throwTestErrorRouter'
import imageRouter from './imageRouter'
import incentiveLevelRoutes from './incentiveLevels'
import prisonIncentiveLevelRoutes from './prisonIncentiveLevels'
import incentivesTableRoutes from './incentivesTable'
import prisonerImagesRoutes from './prisonerImages'
import selectLocationRoutes from './selectLocation'
import reviewsTableRoutes from './reviewsTable'
import standardRouter from './standardRouter'

export default function routes(userService: UserService): Router {
  const router = Router({ mergeParams: true })

  const reviewsTableV1 = incentivesTableRoutes(standardRouter(userService))
  const reviewsTableV2 = reviewsTableRoutes(standardRouter(userService))

  router.use('/select-location', selectLocationRoutes(standardRouter(userService)))
  router.use(
    '/incentive-summary/:locationPrefix',
    standardRouter(userService).use((req, res, next) => {
      const newReviewsTable = userActiveCaseloadMatches(config.featureFlags.newReviewsTable, res.locals.user)
      if (newReviewsTable) {
        reviewsTableV2(req, res, next)
      } else {
        reviewsTableV1(req, res, next)
      }
    }),
  )
  // TODO: allows testing both tables side-by-side; remove once v2 is completed
  if (config.environment !== 'prod') {
    router.use('/incentive-summary--1/:locationPrefix', reviewsTableV1)
    router.use('/incentive-summary--2/:locationPrefix', reviewsTableV2)
  }
  router.use(
    '/incentive-levels',
    environmentGate(['local', 'dev'], incentiveLevelRoutes(standardRouter(userService))),
  )
  router.use(
    '/prison-incentive-levels',
    environmentGate(['local', 'dev'], prisonIncentiveLevelRoutes(standardRouter(userService))),
  )
  router.use('/analytics/:pgdRegionCode([A-Z0-9]{2,5}|National)?', analyticsRouter(standardRouter(userService)))
  router.use('/prisoner-images/:prisonerNumber.jpeg', prisonerImagesRoutes(imageRouter()))
  router.use('/throw-test-error', throwTestErrorRouter(standardRouter(userService)))
  router.use('/', homeRoutes(standardRouter(userService)))

  return router
}
