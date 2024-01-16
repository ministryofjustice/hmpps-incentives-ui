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

export default function routes(router: Router): Router {

  const hmppsAuthClient = new HmppsAuthClient(
      new TokenStore(createRedisClient('routes/prisonerIncentiveLevelDetails.ts')),
  )
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  // @ts-ignore
  const renderTemplate = async (req, res, pageData) => {
      const {prisonerNumber} = req.params
      const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const prisonApi = new PrisonApi(systemToken);
      const incentivesApi = new IncentivesApi(systemToken)
      const {errors, formValues = {}} = pageData || {}

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
          currentIncentiveLevel,
          errors,
          formValues,
          prisonerNumber,
          prisonerName: formatName(firstName, lastName),
          profileUrl: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`,
          selectableLevels,
        })
      } catch (error) {
        res.locals.redirectUrl = `incentive-level-details/prisoner/${prisonerNumber}`
        throw error
      }
  }
    const renderConfirmation = async (req: any, res: any) => {
      const prisonerNumber = req.params.prisonerNumber
      const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const prisonApi = new PrisonApi(systemToken);
      const incentivesApi = new IncentivesApi(systemToken)

      try {
        const prisonerDetails = await prisonApi.getFullDetails(prisonerNumber, true)
        const {agencyId, bookingId, firstName, lastName, assignedLivingUnit} = prisonerDetails
        const locationId: string | undefined = assignedLivingUnit?.description
        const incentiveSummary = await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
        const nextReviewDate = incentiveSummary?.nextReviewDate && moment(incentiveSummary.nextReviewDate, 'YYYY-MM-DD HH:mm')

        return res.render('pages/prisonerChangeIncentiveLevelConfirmation.njk', {
          agencyId,
          bookingId,
          breadcrumbPrisonerName: putLastNameFirst(firstName, lastName),
          cancelUrl: '/',
          incentiveSummary,
          manageIncentivesUrl:
              agencyId && locationId && locationId.includes('-')
                  ? `/incentive-summary/${agencyId}-${locationId.split('-')[0]}`
                  : '/',
          nextReviewDate: nextReviewDate?.format('D MMMM YYYY'),
          prisonerNumber,
          prisonerName: formatName(firstName, lastName),
          profileUrl: `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`,
        })
      } catch (error) {
        res.locals.redirectUrl = `incentive-level-details/prisoner/${prisonerNumber}`
        throw error
      }
    }


  // @ts-ignore
  const index = async (req, res) => renderTemplate(req, res, undefined);
  // @ts-ignore
  const postForm = async (req, res) => {
    const offenderNo  = req.params.offenderNo;
    const errors = [];

    const {agencyId, bookingId, iepLevel, newIepLevel, reason} = req.body || {};


    if (!newIepLevel) {
      errors.push({text: 'Select an incentive level, even if it is the same as before', href: '#newIepLevel'})
    }

    if (!reason) {
      errors.push({text: 'Enter a reason for recording', href: '#reason'})
    }

    if (reason && reason.length > 240) {
      errors.push({text: 'Comments must be 240 characters or less', href: '#reason'})
    }

    // TODO: CHECK URL
    if (errors.length > 0) {
      return renderTemplate(req, res, {errors, formValues: {newIepLevel, reason}});
    }

    try {
      // const changedIncentiveLevel = await incentivesApi.updateIncentiveLevelForPrisoner(prisonerNumber, {
      //   iepLevel: newIepLevel,
      //   comment: reason,
      // })
      // raiseAnalyticsEvent(
      //   'Update Incentive level',
      //   `Level changed from ${iepLevel} to ${newIepLevel} at ${agencyId}`,
      //   'Incentive level change'
      // )
      return renderConfirmation(req, res)
    } catch (error) {
      // TODO: CHECK URL
      res.locals.redirectUrl = `/prisoner/${offenderNo}`
      throw error
    }
  }

    get('/', index);
    post('/', postForm);

    return router;
}
