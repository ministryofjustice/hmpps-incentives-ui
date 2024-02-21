import moment from 'moment'
import type { RequestHandler, Request, Response, Router } from 'express'

import { maintainPrisonerIncentiveLevelRole } from '../data/constants'
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

interface FormData {
  newIepLevel?: string
  reason?: string
}

interface FormError {
  href: string
  text: string
}

async function renderTemplate(
  req: Request,
  res: Response,
  formValues: FormData = {},
  errors: FormError[] = undefined,
): Promise<void> {
  const userRoles = res.locals.user.roles
  const { prisonerNumber } = req.params
  const profileUrl = `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`

  if (!userRoles.includes(maintainPrisonerIncentiveLevelRole)) {
    res.redirect(`/incentive-reviews/prisoner/${prisonerNumber}`)
    return
  }

  try {
    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const prisonApi = new PrisonApi(systemToken)
    const incentivesApi = new IncentivesApi(systemToken)

    const prisonerDetails = await prisonApi.getPrisonerDetails(prisonerNumber)
    const { agencyId, firstName, lastName } = prisonerDetails
    const incentiveLevelDetails: IncentiveSummaryForBookingWithDetails =
      await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
    const currentIncentiveLevel: string = incentiveLevelDetails.iepLevel
    const prisonIncentiveLevels = await incentivesApi.getPrisonIncentiveLevels(agencyId)
    const selectableLevels = prisonIncentiveLevels.map(level => ({
      text: currentIncentiveLevel === level.levelName ? `${level.levelName} (current level)` : level.levelName,
      value: level.levelCode,
      checked: level.levelCode === formValues.newIepLevel,
    }))

    res.locals.breadcrumbs.popLastItem()
    res.locals.breadcrumbs.addItems(
      {
        text: putLastNameFirst(firstName, lastName),
        href: profileUrl,
      },
      {
        text: 'Incentive details',
        href: `/incentive-reviews/prisoner/${prisonerNumber}`,
      },
    )

    res.render('pages/prisonerChangeIncentiveLevelDetails.njk', {
      currentIncentiveLevel,
      cancelUrl: `/incentive-reviews/prisoner/${prisonerNumber}`,
      errors,
      formValues,
      prisonerNumber,
      prisonerName: formatName(firstName, lastName),
      selectableLevels,
    })
  } catch (error) {
    res.redirect(`/incentive-reviews/prisoner/${prisonerNumber}`)
  }
}

async function renderConfirmation(req: Request, res: Response): Promise<void> {
  const { prisonerNumber } = req.params
  const profileUrl = `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`

  const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
  const prisonApi = new PrisonApi(systemToken)
  const incentivesApi = new IncentivesApi(systemToken)

  try {
    const prisonerDetails = await prisonApi.getFullDetails(prisonerNumber, true)
    const { agencyId, firstName, lastName, assignedLivingUnit } = prisonerDetails
    const locationId: string | undefined = assignedLivingUnit?.description
    const incentiveSummary = await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
    const nextReviewDate =
      incentiveSummary?.nextReviewDate && moment(incentiveSummary.nextReviewDate, 'YYYY-MM-DD HH:mm')

    res.locals.breadcrumbs.popLastItem()
    res.locals.breadcrumbs.addItems(
      {
        text: putLastNameFirst(firstName, lastName),
        href: profileUrl,
      },
      {
        text: 'Incentive details',
        href: `/incentive-reviews/prisoner/${prisonerNumber}`,
      },
    )

    res.render('pages/prisonerChangeIncentiveLevelConfirmation.njk', {
      incentiveSummary,
      manageIncentivesUrl:
        agencyId && locationId && locationId.includes('-')
          ? `/incentive-summary/${agencyId}-${locationId.split('-')[0]}`
          : '/select-location',
      nextReviewDate: nextReviewDate?.format('D MMMM YYYY'),
      prisonerNumber,
      prisonerName: formatName(firstName, lastName),
      profileUrl,
    })
  } catch (error) {
    res.redirect(`/incentive-reviews/prisoner/${prisonerNumber}`)
  }
}

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/', async (req, res) => renderTemplate(req, res))

  post('/', async (req, res) => {
    const { prisonerNumber } = req.params
    const { newIepLevel, reason }: FormData = req.body || {}
    const errors: FormError[] = []

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
      await renderTemplate(req, res, { newIepLevel, reason }, errors)
      return
    }

    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const incentivesApi = new IncentivesApi(systemToken)
    try {
      await incentivesApi.updateIncentiveLevelForPrisoner(prisonerNumber, {
        iepLevel: newIepLevel,
        comment: reason,
      })
      await renderConfirmation(req, res)
    } catch (error) {
      res.redirect(`/incentive-reviews/prisoner/${prisonerNumber}`)
    }
  })

  return router
}
