import type { RequestHandler, Request, Response, Router } from 'express'
import moment from 'moment'

import { formatName, putLastNameFirst } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import TokenStore from '../data/tokenStore'
import { createRedisClient } from '../data/redisClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { PrisonApi } from '../data/prisonApi'
import { IncentivesApi } from '../data/incentivesApi'

const hmppsAuthClient = new HmppsAuthClient(
  new TokenStore(createRedisClient('routes/prisonerChangeIncentiveLevelDetails.ts')),
)

export interface FormData {
  newIepLevel?: string
  reason?: string
}

interface FormError {
  href: string
  text: string
}

async function renderForm(
  req: Request,
  res: Response,
  formValues: FormData = {},
  errors: FormError[] = [],
): Promise<void> {
  const { prisonerNumber } = req.params

  const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
  const prisonApi = new PrisonApi(systemToken)
  const incentivesApi = new IncentivesApi(systemToken)

  try {
    const prisonerDetails = await prisonApi.getPrisonerDetails(prisonerNumber)
    const { agencyId, firstName, lastName } = prisonerDetails
    const incentiveLevelDetails = await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
    const currentIncentiveLevel = incentiveLevelDetails.iepLevel
    const prisonIncentiveLevels = await incentivesApi.getPrisonIncentiveLevels(agencyId)
    const selectableLevels = prisonIncentiveLevels.map(level => ({
      text: currentIncentiveLevel === level.levelName ? `${level.levelName} (current level)` : level.levelName,
      value: level.levelCode,
      checked: level.levelCode === formValues.newIepLevel,
    }))

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
    const prisonerDetails = await prisonApi.getPrisonerDetails(prisonerNumber, true)
    const { agencyId, firstName, lastName, assignedLivingUnit } = prisonerDetails
    const locationId: string | undefined = assignedLivingUnit?.description
    const incentiveLevelDetails = await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
    const currentIncentiveLevel = incentiveLevelDetails.iepLevel
    const nextReviewDate =
      incentiveLevelDetails.nextReviewDate && moment(incentiveLevelDetails.nextReviewDate, 'YYYY-MM-DD HH:mm')

    res.render('pages/prisonerChangeIncentiveLevelConfirmation.njk', {
      currentIncentiveLevel,
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

  router.use(
    asyncMiddleware(async (req, res, next) => {
      const { prisonerNumber } = req.params
      const profileUrl = `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`
      const incentiveHistoryUrl = `/incentive-reviews/prisoner/${prisonerNumber}`

      const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const prisonApi = new PrisonApi(systemToken)

      // load prisoner info; propagates 404 if not found
      const prisonerDetails = await prisonApi.getPrisonerDetails(prisonerNumber)
      const { firstName, lastName } = prisonerDetails

      // require prisoner to be in user’s caseloads (role is already checked by `authorisationMiddleware`)
      const prisonerWithinCaseloads = res.locals.user.caseloads.some(
        caseload => caseload.id === prisonerDetails.agencyId,
      )
      if (!prisonerWithinCaseloads) {
        res.redirect(incentiveHistoryUrl)
        return
      }

      res.locals.breadcrumbs.popLastItem()
      res.locals.breadcrumbs.addItems(
        {
          text: putLastNameFirst(firstName, lastName),
          href: profileUrl,
        },
        {
          text: 'Incentive details',
          href: incentiveHistoryUrl,
        },
      )

      next()
    }),
  )

  get('/', async (req, res) => renderForm(req, res))

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
      await renderForm(req, res, { newIepLevel, reason }, errors)
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
