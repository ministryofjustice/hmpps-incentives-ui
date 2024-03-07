import type { RequestHandler, Router } from 'express'

import format from '../utils/format'
import { formatName, parseDateInput, putLastNameFirst } from '../utils/utils'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { maintainPrisonerIncentiveLevelRole, SYSTEM_USERS } from '../data/constants'
import TokenStore from '../data/tokenStore'
import { createRedisClient } from '../data/redisClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { PrisonApi, type Staff } from '../data/prisonApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import { IncentivesApi, type IncentiveReviewHistoryItem } from '../data/incentivesApi'
import type { ErrorSummaryItem, GovukSelectItem } from './forms/forms'

interface FormData {
  agencyId?: string
  incentiveLevel?: string
  fromDate?: string
  toDate?: string
}

type HistoryDetail = IncentiveReviewHistoryItem & {
  iepEstablishment: string
  iepStaffMember: string | undefined
}

type HistoryFilters = {
  agencyId?: string
  incentiveLevel?: string
  fromDate?: Date
  toDate?: Date
}

const filterData = (data: HistoryDetail[], fields: HistoryFilters): HistoryDetail[] => {
  let filteredResults = data

  if (fields.agencyId) {
    filteredResults = filteredResults.filter(result => result.agencyId === fields.agencyId)
  }

  if (fields.incentiveLevel) {
    filteredResults = filteredResults.filter(result => result.iepLevel === fields.incentiveLevel)
  }

  if (fields.fromDate) {
    filteredResults = filteredResults.filter(result => result.iepTime >= fields.fromDate)
  }

  if (fields.toDate) {
    const toDate = new Date(fields.toDate) // copy object rather than mutating in-place
    toDate.setDate(toDate.getDate() + 1)
    filteredResults = filteredResults.filter(result => result.iepTime < toDate)
  }

  return filteredResults
}

function resolvedToConcreteValue<T>(
  promise: PromiseSettledResult<T | null | undefined>,
): promise is PromiseFulfilledResult<T> {
  return promise.status === 'fulfilled' && promise.value !== undefined && promise.value !== null
}

const hmppsAuthClient = new HmppsAuthClient(
  new TokenStore(createRedisClient('routes/prisonerIncentiveLevelDetails.ts')),
)

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { prisonerNumber } = req.params
    const { agencyId, incentiveLevel, fromDate: fromDateInput, toDate: toDateInput }: FormData = req.query
    const profileUrl = `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`

    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const prisonApi = new PrisonApi(systemToken)
    const offenderSearchClient = new OffenderSearchClient(systemToken)
    const incentivesApi = new IncentivesApi(systemToken)

    // load prisoner info; propagates 404 if not found
    const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)
    const { firstName, lastName } = prisoner
    const prisonerName = formatName(firstName, lastName)

    const incentiveLevelDetails = await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
    const { iepLevel: currentIncentiveLevel, nextReviewDate } = incentiveLevelDetails

    const prisonerWithinCaseloads = res.locals.user.caseloads.some(caseload => caseload.id === prisoner.prisonId)
    const userCanMaintainIncentives = res.locals.user.roles.includes(maintainPrisonerIncentiveLevelRole)

    const todayAsShortDate = format.formDate(new Date())

    // Offenders are likely to have multiple IEPs at the same agency.
    // By getting a unique list of users and agencies, we reduce the duplicate
    // calls to the database.
    const uniqueUserIds = Array.from(new Set(incentiveLevelDetails.iepDetails.map(details => details.userId)))
    const uniqueAgencyIds = Array.from(new Set(incentiveLevelDetails.iepDetails.map(details => details.agencyId)))

    // Only get users that map to a user in the prison staff table
    const users: Staff[] = (
      await Promise.allSettled(
        uniqueUserIds
          .filter(userId => Boolean(userId))
          .map(userId => {
            if (SYSTEM_USERS.includes(userId)) {
              return {
                firstName: 'System',
                lastName: '',
                username: userId,
                staffId: undefined,
                activeCaseLoadId: undefined,
                active: undefined,
              }
            }
            return prisonApi.getStaffDetails(userId)
          }),
      )
    )
      .filter(resolvedToConcreteValue)
      .map(promise => promise.value)

    const establishments = await Promise.all(
      uniqueAgencyIds.filter(id => Boolean(id)).map(id => prisonApi.getAgency(id)),
    )
    const levels = Array.from(new Set(incentiveLevelDetails.iepDetails.map(details => details.iepLevel))).sort()

    const iepHistoryDetails: HistoryDetail[] = incentiveLevelDetails.iepDetails.map(details => {
      const { description } = establishments.find(estb => estb.agencyId === details.agencyId)
      const user = details.userId && users.find(u => u.username === details.userId)

      return {
        ...details,
        iepEstablishment: description,
        iepStaffMember: user && formatName(user.firstName, user.lastName),
      }
    })

    const errors: ErrorSummaryItem[] = []

    if (agencyId && !establishments.some(agency => agency.agencyId === agencyId)) {
      errors.push({ href: '#agencyId', text: 'Choose an establishment' })
    }

    if (incentiveLevel && !levels.some(level => level === incentiveLevel)) {
      errors.push({ href: '#incentiveLevel', text: 'Choose an incentive level' })
    }

    let fromDate: Date | undefined
    let toDate: Date | undefined
    try {
      if (fromDateInput) {
        fromDate = parseDateInput(fromDateInput)
      }
    } catch (e) {
      errors.push({ href: '#fromDate', text: `Enter a from date, for example ${todayAsShortDate}` })
    }
    try {
      if (toDateInput) {
        toDate = parseDateInput(toDateInput)
      }
    } catch (e) {
      errors.push({ href: '#toDate', text: `Enter a to date, for example ${todayAsShortDate}` })
    }
    if (fromDate && toDate && fromDate > toDate) {
      errors.push({ href: '#fromDate', text: 'Enter a from date which is not after the to date' })
      errors.push({ href: '#toDate', text: 'Enter a to date which is not before the from date' })
    }

    const filteredResults =
      errors.length === 0
        ? filterData(iepHistoryDetails, {
            agencyId,
            incentiveLevel,
            fromDate,
            toDate,
          })
        : []

    const formValues: FormData = {
      agencyId,
      incentiveLevel,
      fromDate: fromDateInput,
      toDate: toDateInput,
    }
    const noFiltersSupplied = Boolean(!agencyId && !incentiveLevel && !fromDate && !toDate)
    const noResultsFoundMessage =
      (!filteredResults.length &&
        (noFiltersSupplied
          ? `${prisonerName} has no incentive level history`
          : 'There is no incentive level history for the selections you have made')) ||
      ''

    res.locals.breadcrumbs.popLastItem()
    res.locals.breadcrumbs.addItems({
      text: putLastNameFirst(firstName, lastName),
      href: profileUrl,
    })

    res.render('pages/prisonerIncentiveLevelDetails.njk', {
      currentIncentiveLevel,
      establishments: establishments
        .sort((a, b) => a.description.localeCompare(b.description))
        .map(
          establishment =>
            ({
              text: establishment.description,
              value: establishment.agencyId,
            }) satisfies GovukSelectItem,
        ),
      errors,
      formValues,
      levels: levels.map(
        level =>
          ({
            text: level,
            value: level,
          }) satisfies GovukSelectItem,
      ),
      maxDate: todayAsShortDate,
      nextReviewDate,
      noResultsFoundMessage,
      prisonerName,
      recordIncentiveUrl: `/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`,
      results: filteredResults,
      noFiltersSupplied,
      userCanUpdateIEP: prisonerWithinCaseloads && userCanMaintainIncentives,
    })
  })

  return router
}
