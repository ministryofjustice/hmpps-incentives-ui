import moment from 'moment'
import { RequestHandler, Router } from 'express'

import { formatName, putLastNameFirst } from '../utils/utils'
import { PrisonApi } from '../data/prisonApi'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore'
import { createRedisClient } from '../data/redisClient'
import { IncentiveSummaryForBookingWithDetails, IncentivesApi } from '../data/incentivesApi'
import asyncMiddleware from '../middleware/asyncMiddleware'

const hmppsAuthClient = new HmppsAuthClient(
  new TokenStore(createRedisClient('routes/prisonerChangeIncentiveLevelDetails.ts')),
)

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const renderTemplate = async (req, res, pageData) => {
    const { prisonerNumber } = req.params
    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const prisonApi = new PrisonApi(systemToken)
    const incentivesApi = new IncentivesApi(systemToken)
    const { errors, formValues = {} } = pageData || {}

    try {
      const prisonerDetails = await prisonApi.getPrisonerDetails(prisonerNumber)
      const { agencyId, bookingId, firstName, lastName } = prisonerDetails
      const incentiveLevelDetails: IncentiveSummaryForBookingWithDetails =
        await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
      const currentIncentiveLevel: string = incentiveLevelDetails.iepLevel
      const prisonIncentiveLevels = await incentivesApi.getPrisonIncentiveLevels(agencyId)
      const selectableLevels = prisonIncentiveLevels.map(level => ({
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const renderConfirmation = async (req, res) => {
    const { prisonerNumber } = req.params
    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const prisonApi = new PrisonApi(systemToken)
    const incentivesApi = new IncentivesApi(systemToken)

    try {
      const prisonerDetails = await prisonApi.getFullDetails(prisonerNumber, true)
      const { agencyId, bookingId, firstName, lastName, assignedLivingUnit } = prisonerDetails
      const locationId: string | undefined = assignedLivingUnit?.description
      const incentiveSummary = await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
      const nextReviewDate =
        incentiveSummary?.nextReviewDate && moment(incentiveSummary.nextReviewDate, 'YYYY-MM-DD HH:mm')

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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const index = async (req, res) => renderTemplate(req, res, undefined)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const postForm = async (req, res) => {
    const { prisonerNumber } = req.params
    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const incentivesApi = new IncentivesApi(systemToken)
    const { offenderNo } = req.params
    const errors: { href: string; text: string }[] = []

    const { newIepLevel, reason } = req.body || {}

    if (!newIepLevel) {
      errors.push({ text: 'Select an incentive level, even if it is the same as before', href: '#newIepLevel' })
    }

    if (!reason) {
      errors.push({ text: 'Enter a reason for recording', href: '#reason' })
    }

    if (reason && reason.length > 240) {
      errors.push({ text: 'Comments must be 240 characters or less', href: '#reason' })
    }

    if (errors.length > 0) {
      return renderTemplate(req, res, { errors, formValues: { newIepLevel, reason } })
    }

    try {
      await incentivesApi.updateIncentiveLevelForPrisoner(prisonerNumber, {
        iepLevel: newIepLevel,
        comment: reason,
      })
      return renderConfirmation(req, res)
    } catch (error) {
      res.locals.redirectUrl = `${res.app.locals.dpsUrl}/prisoner/${offenderNo}`
      throw error
    }
  }

  get('/', index)
  post('/', postForm)

  return router
}
