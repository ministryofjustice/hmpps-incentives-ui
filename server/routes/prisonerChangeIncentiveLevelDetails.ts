import {formatName, putLastNameFirst} from '../utils/utils'
import {PrisonApi} from "../data/prisonApi";
import HmppsAuthClient from "../data/hmppsAuthClient";
import TokenStore from "../data/tokenStore";
import {createRedisClient} from "../data/redisClient";
import {IncentiveSummaryForBookingWithDetails, IncentivesApi} from "../data/incentivesApi";
import {RequestHandler, Router} from "express";
import asyncMiddleware from "../middleware/asyncMiddleware";

const hmppsAuthClient = new HmppsAuthClient(
  new TokenStore(createRedisClient('routes/prisonerIncentiveLevelDetails.ts')),
)

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res, pageData: any) => {
    const {prisonerNumber} = req.params
    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const prisonApi = new PrisonApi(systemToken);
    const incentivesApi = new IncentivesApi(systemToken)
    const { errors, formValues = {} } = pageData || {}
    try {

      const prisonerDetails = await prisonApi.getDetails(prisonerNumber)
      const {agencyId, bookingId, firstName, lastName} = prisonerDetails
      const incentiveLevelDetails: IncentiveSummaryForBookingWithDetails = await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
      const currentIncentiveLevel: string = incentiveLevelDetails.iepLevel
      const prisonIncentiveLevels = await incentivesApi.getPrisonIncentiveLevels(agencyId)

      const selectableLevels = prisonIncentiveLevels.map((level) => ({
        text: currentIncentiveLevel === level.levelName ? `${level.levelName} (current level)` : level.levelName,
        value: level.levelCode,
        checked: level.levelCode === formValues.newIepLevel,
      }))

      return res.render('pages/prisonerChangeIncentiveLevelDetails.njk', {
        agencyId,
        bookingId,
        breadcrumbPrisonerName: putLastNameFirst(firstName, lastName),
        errors,
        currentIncentiveLevel,
        formValues,
        prisonerNumber,
        prisonerName: formatName(firstName, lastName),
        profileUrl: `/prisoner/${prisonerNumber}`,
        selectableLevels,
      })
    } catch (error) {
      res.locals.redirectUrl = `/prisoner/${prisonerNumber}`
      throw error
    }
  })
  return router
}
