import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import HmppsAuthClient from '../data/hmppsAuthClient'

import asyncMiddleware from '../middleware/asyncMiddleware'
import { IncentivesApi, ErrorCode, ErrorResponse } from '../data/incentivesApi'
import TokenStore from '../data/tokenStore'
import { createRedisClient } from '../data/redisClient'
import { OffenderSearchClient } from '../data/offenderSearch'
import { nameOfPerson } from '../utils/utils'

const hmppsAuthClient = new HmppsAuthClient(
  new TokenStore(createRedisClient('routes/prisonerIncentiveLevelDetails.ts')),
)
export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  router.use((req, res, next) => {
    res.locals.breadcrumbs.addItems({ text: 'Incentive Reviews TODO', href: '/incentive-reviews' })
    next()
  })

  get('/:prisonerNumber', async (req, res) => {
    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)

    const incentivesApi = new IncentivesApi(systemToken)
    const { prisonerNumber } = req.params
    const offenderSearchClient = new OffenderSearchClient(systemToken)

    const incentiveLevel = await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
    const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)
    const prisonerName = nameOfPerson(prisoner)

    res.render('pages/prisonerIncentiveLevelDetails.njk', { messages: req.flash(), incentiveLevel, prisonerName })
  })

  return router
}
