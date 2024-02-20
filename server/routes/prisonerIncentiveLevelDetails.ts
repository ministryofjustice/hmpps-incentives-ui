import moment from 'moment'
import type { RequestHandler, Router } from 'express'

import HmppsAuthClient from '../data/hmppsAuthClient'
import { PrisonApi, Staff } from '../data/prisonApi'

import asyncMiddleware from '../middleware/asyncMiddleware'
import { IncentivesApi, IncentiveSummaryDetail, IncentiveSummaryForBookingWithDetails } from '../data/incentivesApi'

import TokenStore from '../data/tokenStore'
import { createRedisClient } from '../data/redisClient'
import { OffenderSearchClient } from '../data/offenderSearch'
import { nameOfPerson, putLastNameFirst, newDaysSince, formatName } from '../utils/utils'

type HistoryDetail = IncentiveSummaryDetail & {
  iepEstablishment: string
  iepStaffMember: string | undefined
  formattedTime: string
}

type HistoryFilters = {
  agencyId?: string
  incentiveLevel?: string
  fromDate?: string
  toDate?: string
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
    const fromDate = moment(fields.fromDate)
    filteredResults = filteredResults.filter(result => moment(result.iepDate).isSameOrAfter(fromDate))
  }

  if (fields.toDate) {
    const toDate = moment(fields.toDate)
    filteredResults = filteredResults.filter(result => moment(result.iepDate).isSameOrBefore(toDate))
  }

  return filteredResults
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

/**
 * Usernames that will be displayed as "System" in the "Recorded by" column
 */
const SYSTEM_USERS = ['INCENTIVES_API']

const hmppsAuthClient = new HmppsAuthClient(
  new TokenStore(createRedisClient('routes/prisonerIncentiveLevelDetails.ts')),
)

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/:prisonerNumber', async (req, res) => {
    const { prisonerNumber } = req.params
    const profileUrl = `${res.app.locals.dpsUrl}/prisoner/${prisonerNumber}`

    const systemToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const userRoles = res.locals.user.roles
    const prisonApi = new PrisonApi(systemToken)
    const incentivesApi = new IncentivesApi(systemToken)
    const prisonerDetails = await prisonApi.getPrisonerDetails(prisonerNumber)

    try {
      const offenderSearchClient = new OffenderSearchClient(systemToken)
      const incentiveLevelDetails: IncentiveSummaryForBookingWithDetails =
        await incentivesApi.getIncentiveSummaryForPrisoner(prisonerNumber)
      const currentIncentiveLevel = incentiveLevelDetails.iepLevel
      const {
        agencyId,
        incentiveLevel,
        fromDate,
        toDate,
      }: {
        agencyId?: string
        incentiveLevel?: string
        fromDate?: string
        toDate?: string
      } = req.query
      const nextReviewDate = moment(incentiveLevelDetails.nextReviewDate, 'YYYY-MM-DD HH:mm')
      const reviewDaysOverdue = newDaysSince(nextReviewDate)

      const prisonerWithinCaseloads = res.locals.user.caseloads.find(
        caseload => caseload.id === prisonerDetails.agencyId,
      )
      const userCanMaintainIncentives = userRoles.find(role => role === 'ROLE_MAINTAIN_IEP')
      const fromDateFormatted = moment(fromDate, 'DD/MM/YYYY')
      const toDateFormatted = moment(toDate, 'DD/MM/YYYY')

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
            .map((userId: string) => {
              if (SYSTEM_USERS.includes(userId)) {
                return {
                  username: userId,
                  firstName: 'System',
                  lastName: '',
                }
              }
              return prisonApi.getStaffDetails(userId)
            }),
        )
      )
        .filter(promise => {
          return promise.status === 'fulfilled' && notEmpty(promise.value)
        })
        .map((promise: PromiseFulfilledResult<Staff>) => promise.value)

      const establishments = await Promise.all(
        uniqueAgencyIds.filter(id => Boolean(id)).map(id => prisonApi.getAgency(id)),
      )
      const levels = Array.from(new Set(incentiveLevelDetails.iepDetails.map(details => details.iepLevel))).sort()

      const iepHistoryDetails: HistoryDetail[] = incentiveLevelDetails.iepDetails.map(details => {
        const { description } = establishments.find(estb => estb.agencyId === details.agencyId)
        const user = details.userId && users.find(u => u.username === details.userId)

        return {
          iepEstablishment: description,
          iepStaffMember: user && `${formatName(user.firstName, user.lastName)}`.trim(),
          formattedTime: moment(details.iepTime, 'YYYY-MM-DD HH:mm').format('D MMMM YYYY - HH:mm'),
          ...details,
        }
      })

      const filteredResults = filterData(iepHistoryDetails, {
        agencyId,
        incentiveLevel,
        fromDate: fromDate && fromDateFormatted.format('YYYY-MM-DD'),
        toDate: toDate && toDateFormatted.format('YYYY-MM-DD'),
      })

      const prisoner = await offenderSearchClient.getPrisoner(prisonerNumber)
      const prisonerName = nameOfPerson(prisoner)
      const { firstName, lastName } = prisoner
      const errors: { href: string; text: string }[] = []

      const noFiltersSupplied = Boolean(!agencyId && !incentiveLevel && !fromDate && !toDate)

      const noResultsFoundMessage =
        (!filteredResults.length &&
          (noFiltersSupplied
            ? `${formatName(firstName, lastName)} has no incentive level history`
            : 'There is no incentive level history for the selections you have made')) ||
        ''

      if (fromDate && toDate && fromDateFormatted.isAfter(toDateFormatted, 'day')) {
        errors.push({ href: '#fromDate', text: 'Enter a from date which is not after the to date' })
        errors.push({ href: '#toDate', text: 'Enter a to date which is not before the from date' })
      }

      res.locals.breadcrumbs.popLastItem()
      res.locals.breadcrumbs.addItems({
        text: putLastNameFirst(firstName, lastName),
        href: profileUrl,
      })

      res.render('pages/prisonerIncentiveLevelDetails.njk', {
        currentIncentiveLevel,
        establishments: establishments
          .sort((a, b) => a.description.localeCompare(b.description))
          .map(establishment => ({
            text: establishment.description,
            value: establishment.agencyId,
          })),
        errors,
        formValues: req.query,
        levels: levels.map(level => ({
          text: level,
          value: level,
        })),
        nextReviewDate: nextReviewDate.format('D MMMM YYYY'),
        noResultsFoundMessage,
        prisonerName,
        recordIncentiveUrl: `/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`,
        reviewDaysOverdue,
        results: filteredResults,
        userCanUpdateIEP: Boolean(prisonerWithinCaseloads && userCanMaintainIncentives),
      })
    } catch (error) {
      res.redirect(profileUrl)
    }
  })

  return router
}
