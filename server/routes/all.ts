import { Router } from 'express'

import authorisationMiddleware from '../middleware/authorisationMiddleware'
import type UserService from '../services/userService'
import homeRoutes from './home'
import analyticsRouter from './analyticsRouter'
import throwTestErrorRouter from './throwTestErrorRouter'
import imageRouter from './imageRouter'
import incentiveLevelRoutes from './incentiveLevels'
import prisonerIncentiveLevels from './prisonerIncentiveLevelDetails'
import prisonerChangeIncentiveLevelDetails from './prisonerChangeIncentiveLevelDetails'
import prisonIncentiveLevelRoutes from './prisonIncentiveLevels'
import {
  maintainPrisonerIncentiveLevelRole,
  managePrisonIncentiveLevelsRole,
  manageIncentiveLevelsRole,
} from '../data/constants'
import prisonerImagesRoutes from './prisonerImages'
import selectLocationRoutes from './selectLocation'
import reviewsTableRoutes from './reviewsTable'
import standardRouter from './standardRouter'

export default function routes(userService: UserService): Router {
  const router = Router({ mergeParams: true })

  // incentive reviews table
  router.use('/select-location', selectLocationRoutes(standardRouter(userService)))
  router.use('/incentive-summary/:locationPrefix', reviewsTableRoutes(standardRouter(userService)))

  // prisoner incentive level history and update page
  router.use('/incentive-reviews/prisoner/:prisonerNumber', prisonerIncentiveLevels(standardRouter(userService)))
  router.use(
    '/incentive-reviews/prisoner/:prisonerNumber/change-incentive-level',
    authorisationMiddleware([maintainPrisonerIncentiveLevelRole]),
    prisonerChangeIncentiveLevelDetails(standardRouter(userService)),
  )

  // admin
  router.use(
    '/incentive-levels',
    authorisationMiddleware([manageIncentiveLevelsRole]),
    incentiveLevelRoutes(standardRouter(userService)),
  )
  router.use(
    '/prison-incentive-levels',
    authorisationMiddleware([managePrisonIncentiveLevelsRole]),
    prisonIncentiveLevelRoutes(standardRouter(userService)),
  )

  // analytics charts
  router.use('/analytics/:pgdRegionCode([A-Z0-9]{2,5}|National)?', analyticsRouter(standardRouter(userService)))

  // misc
  router.use('/prisoner-images/:prisonerNumber.jpeg', prisonerImagesRoutes(imageRouter()))
  router.use('/throw-test-error', throwTestErrorRouter(standardRouter(userService)))
  router.use('/', homeRoutes(standardRouter(userService)))

  return router
}
