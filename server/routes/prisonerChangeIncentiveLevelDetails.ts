import moment from 'moment'
import {formatName, putLastNameFirst} from '../utils/utils'
import {PrisonApi} from "../data/prisonApi";
import HmppsAuthClient from "../data/hmppsAuthClient";
import TokenStore from "../data/tokenStore";
import {createRedisClient} from "../data/redisClient";
import {IncentiveSummaryForBookingWithDetails, IncentivesApi} from "../data/incentivesApi";
import {RequestHandler, Router} from "express";
import asyncMiddleware from "../middleware/asyncMiddleware";
import {raiseAnalyticsEvent} from "../utils/raiseAnalyticsEvent";

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
        // TODO: URL set up incorrect
        profileUrl: `incentive-reviews/prisoner/${prisonerNumber}`,
        selectableLevels,
      })
    } catch (error) {
      res.locals.redirectUrl = `/prisoner/${prisonerNumber}`
      throw error
    }
  })

  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  post('/', async (req, res, pageData: any) => {
    const prisonerNumber = req.params.prisonerNumber
    const errors = []
    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const incentivesApi = new IncentivesApi(systemToken)

    const renderConfirmation = async (req: any, res: any) => {
      const { prisonerNumber } = req.params
      const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const prisonApi = new PrisonApi(systemToken);

      try {
        const prisonerDetails = await prisonApi.getFullDetails(prisonerNumber, true)
        const { agencyId, bookingId, firstName, lastName, assignedLivingUnit } = prisonerDetails
        const locationId: string | undefined = assignedLivingUnit?.description
        const iepSummary = await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
        const nextReviewDate = iepSummary?.nextReviewDate && moment(iepSummary.nextReviewDate, 'YYYY-MM-DD HH:mm')

        return res.render('pages/prisonerChangeIncentiveLevelConfirmation.njk', {
          agencyId,
          bookingId,
          breadcrumbPrisonerName: putLastNameFirst(firstName, lastName),
          prisonerNumber,
          prisonerName: formatName(firstName, lastName),
          profileUrl: `/prisoner/${prisonerNumber}`,
          // TODO: FIX URL
          manageIncentivesUrl:
            agencyId && locationId && locationId.includes('-')
              ? `${res.app.locals.dpsUrl}/incentive-summary/${agencyId}-${locationId.split('-')[0]}`
              : res.app.locals.dpsUrl,
          iepSummary,
          nextReviewDate: nextReviewDate?.format('D MMMM YYYY'),
        })
      } catch (error) {
        res.locals.redirectUrl = `/prisoner/${prisonerNumber}/incentive-level-details`
        throw error
      }
    }

    const {agencyId, bookingId, iepLevel, newIepLevel, reason} = req.body || {}

    if (!newIepLevel) {
      errors.push({text: 'Select an incentive level, even if it is the same as before', href: '#newIepLevel'})
    }

    if (!reason) {
      errors.push({text: 'Enter a reason for recording', href: '#reason'})
    }

    if (reason && reason.length > 240) {
      errors.push({text: 'Comments must be 240 characters or less', href: '#reason'})
    }

    // TODO: FIX URL
    if (errors.length > 0) {
      res.locals.redirectUrl = `/prisoner/${prisonerNumber}`

return
    }
    try {
      const changedIncentiveLevel = await incentivesApi.updateIncentiveLevelForPrisoner(prisonerNumber, {
        iepLevel: newIepLevel,
        comment: reason,
      })
      raiseAnalyticsEvent(
        'Update Incentive level',
        `Level changed from ${iepLevel} to ${newIepLevel} at ${agencyId}`,
        'Incentive level change'
      )
      console.log('ATTEMPTING')
      return renderConfirmation(req, res)
    } catch (error) {
      // TODO: FIX URL
      // res.locals.redirectUrl = `/prisoner/${prisonerNumber}`
      throw error
    }

  })

  return router
}
