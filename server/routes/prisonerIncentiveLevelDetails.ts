import moment from 'moment'
import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import HmppsAuthClient from '../data/hmppsAuthClient'

import asyncMiddleware from '../middleware/asyncMiddleware'
import {
  IncentivesApi,
  ErrorCode,
  ErrorResponse,
  IepSummaryDetail, IepSummaryForBookingWithDetails
} from '../data/incentivesApi'
import TokenStore from '../data/tokenStore'
import { createRedisClient } from '../data/redisClient'
import { OffenderSearchClient } from '../data/offenderSearch'
import {nameOfPerson, putLastNameFirst} from '../utils/utils'
import { newDaysSince } from "../utils/utils";

const hmppsAuthClient = new HmppsAuthClient(
  new TokenStore(createRedisClient('routes/prisonerIncentiveLevelDetails.ts')),
)
export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/:prisonerNumber', async (req, res) => {
    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const { prisonerNumber } = req.params

    const incentivesApi = new IncentivesApi(systemToken)

    const offenderSearchClient = new OffenderSearchClient(systemToken)

    const incentiveLevel: IepSummaryForBookingWithDetails= await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
    const currentIepLevel = incentiveLevel.iepLevel

    const nextReviewDate = moment(incentiveLevel.nextReviewDate, 'YYYY-MM-DD HH:mm')
    const reviewDaysOverdue = newDaysSince(nextReviewDate)

    const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)
    const prisonerName = nameOfPerson(prisoner)
    const { firstName, lastName } =  prisoner

    res.render('pages/prisonerIncentiveLevelDetails.njk', { messages: req.flash(),
      breadcrumbPrisonerName: putLastNameFirst(firstName, lastName),
      currentIepLevel,
      incentiveLevel,
      nextReviewDate: nextReviewDate.format('D MMMM YYYY'),
      prisonerName,
      profileUrl: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`,
      recordIncentiveUrl:`/prisoner/${prisonerNumber}/incentive-level-details/change-incentive-level`,
      reviewDaysOverdue,
      // TODO: userCanUpdateIEP
      userCanUpdateIEP: true
    })
  })

  return router
}
