import moment from 'moment'
import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import HmppsAuthClient from '../data/hmppsAuthClient'
import {PrisonApi} from "../data/prisonApi";

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

    const incentiveLevelDetails: IepSummaryForBookingWithDetails= await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
    const currentIncentiveLevel = incentiveLevelDetails.iepLevel

    const nextReviewDate = moment(incentiveLevelDetails.nextReviewDate, 'YYYY-MM-DD HH:mm')
    const reviewDaysOverdue = newDaysSince(nextReviewDate)

    // Offenders are likely to have multiple IEPs at the same agency.
    // By getting a unique list of users and agencies, we reduce the duplicate
    // calls to the database.
    const uniqueUserIds = Array.from(new Set(incentiveLevelDetails.iepDetails.map((details) => details.userId)))
    const uniqueAgencyIds = Array.from(new Set(incentiveLevelDetails.iepDetails.map((details) => details.agencyId)))

    const prisonApi = new PrisonApi(systemToken);
    const establishments: any[] = await Promise.all(uniqueAgencyIds.filter((id) => Boolean(id)).map((id) => prisonApi.getAgencyDetails(systemToken, id))
    )
    const levels = Array.from(new Set(incentiveLevelDetails.iepDetails.map((details) => details.iepLevel))).sort()

    const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)
    const prisonerName = nameOfPerson(prisoner)
    const { firstName, lastName } =  prisoner

    console.log(incentiveLevelDetails)

    res.render('pages/prisonerIncentiveLevelDetails.njk', { messages: req.flash(),
      breadcrumbPrisonerName: putLastNameFirst(firstName, lastName),
      currentIncentiveLevel,
      establishments: establishments
        .sort((a, b) => a.description.localeCompare(b.description))
        .map((establishment) => ({
          text: establishment.description,
          value: establishment.agencyId,
        })),
      formValues: req.query,
      incentiveLevelDetails,
      levels: levels.map((level) => ({
        text: level,
        value: level,
      })),
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
