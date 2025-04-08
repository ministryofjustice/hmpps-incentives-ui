// eslint-disable-next-line max-classes-per-file
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'

import config from '../config'
import { convertIncentiveReviewHistoryDates, convertIncentiveReviewItemDates } from './incentivesApiUtils'
import logger from '../../logger'

/**
 * Structure representing an error response from the incentives api
 */
export class ErrorResponse {
  status: number

  errorCode?: ErrorCode

  userMessage?: string

  developerMessage?: string

  moreInfo?: string

  static isErrorResponse(obj: object): obj is ErrorResponse {
    // TODO: would be nice to make userMessage & developerMessage non-nullable in the api
    return obj && 'status' in obj && typeof obj.status === 'number'
  }
}

/**
 * Unique codes to discriminate errors returned from the incentives api.
 * Defined in uk.gov.justice.digital.hmpps.incentivesapi.config.ErrorResponse enumeration
 * https://github.com/ministryofjustice/hmpps-incentives-api/blob/a82fbcb02cd146e52e3a498d0affd4832740d916/src/main/kotlin/uk/gov/justice/digital/hmpps/incentivesapi/config/HmppsIncentivesApiExceptionHandler.kt#L265-L276
 */
export enum ErrorCode {
  IncentiveLevelActiveIfRequired = 100,
  IncentiveLevelActiveIfActiveInPrison = 101,
  IncentiveLevelCodeNotUnique = 102,
  IncentiveLevelReorderNeedsFullSet = 103,

  PrisonIncentiveLevelActiveIfRequired = 200,
  PrisonIncentiveLevelActiveIfDefault = 201,
  PrisonIncentiveLevelActiveIfPrisonersExist = 202,
  PrisonIncentiveLevelNotGloballyActive = 203,
  PrisonIncentiveLevelDefaultRequired = 204,
}

export interface IncentiveLevel {
  code: string
  name: string
  active: boolean
  required: boolean
}

export type IncentiveLevelUpdate = Omit<Partial<IncentiveLevel>, 'code'>

export interface PrisonIncentiveLevel {
  prisonId: string
  levelCode: string
  levelName: string
  active: boolean
  defaultOnAdmission: boolean

  remandTransferLimitInPence: number
  remandSpendLimitInPence: number
  convictedTransferLimitInPence: number
  convictedSpendLimitInPence: number

  visitOrders: number
  privilegedVisitOrders: number
}

export type PrisonIncentiveLevelUpdate = Omit<Partial<PrisonIncentiveLevel>, 'prisonId' | 'levelCode' | 'levelName'>

export const sortOptions = [
  'PRISONER_NUMBER',
  'FIRST_NAME',
  'LAST_NAME',
  'NEXT_REVIEW_DATE',
  'DAYS_SINCE_LAST_REVIEW',
  'POSITIVE_BEHAVIOURS',
  'NEGATIVE_BEHAVIOURS',
  'HAS_ACCT_OPEN',
  'IS_NEW_TO_PRISON',
] as const
export const orderOptions = ['ASC', 'DESC'] as const

export type IncentivesReviewsPaginationAndSorting = {
  sort?: (typeof sortOptions)[number]
  order?: (typeof orderOptions)[number]
  page?: number
  pageSize?: number
}

export type IncentivesReviewsRequest = {
  agencyId: string
  locationPrefix: string
  levelCode: string
} & IncentivesReviewsPaginationAndSorting

export interface IncentivesReviewsResponse {
  locationDescription: string
  overdueCount: number
  reviewCount: number
  levels: IncentivesReviewsLevel[]
  reviews: IncentivesReview[]
}

export interface IncentivesReviewsLevel {
  levelCode: string
  levelName: string
  reviewCount: number
  overdueCount: number
}

export interface IncentivesReview {
  firstName: string
  lastName: string
  levelCode: string
  prisonerNumber: string
  bookingId: number
  nextReviewDate: Date
  daysSinceLastReview: number | null
  positiveBehaviours: number
  negativeBehaviours: number
  hasAcctOpen: boolean
  isNewToPrison: boolean
}

export interface IncentiveReviewHistoryItem {
  prisonerNumber: string
  bookingId: number
  iepCode: string
  iepLevel: string
  iepDate: Date
  iepTime: Date
  comments: string | null
  agencyId: string
  userId: string | null
  // also available:
  //   auditModuleName: string
  //   locationId: string | null
  //   reviewType: string
}

export type IncentiveReviewHistory = {
  prisonerNumber: string
  bookingId: number
  iepCode: string
  iepLevel: string
  iepDate: Date
  iepTime: Date
  daysSinceReview: number
  nextReviewDate: Date
  iepDetails: IncentiveReviewHistoryItem[]
  // also available:
  //   locationId: string | null
}

export type UpdateIncentiveLevelRequest = {
  iepLevel: string
  comment: string
}

export class IncentivesApi extends RestClient {
  constructor(systemToken: string) {
    super('HMPPS Incentives API', config.apis.hmppsIncentivesApi, logger, {
      getToken: async () => systemToken,
    })
  }

  getIncentiveSummaryForPrisoner(prisonerNumber: string): Promise<IncentiveReviewHistory> {
    return this.get<DatesAsStrings<IncentiveReviewHistory>>(
      {
        path: `/incentive-reviews/prisoner/${encodeURIComponent(prisonerNumber)}`,
      },
      asSystem(),
    ).then(response => convertIncentiveReviewHistoryDates(response))
  }

  /**
   * @throws SanitisedError<ErrorResponse>
   */
  updateIncentiveLevelForPrisoner(
    prisonerNumber: string,
    data: UpdateIncentiveLevelRequest,
  ): Promise<IncentiveReviewHistoryItem> {
    return this.post<DatesAsStrings<IncentiveReviewHistoryItem>>(
      {
        path: `/incentive-reviews/prisoner/${encodeURIComponent(prisonerNumber)}`,
        data,
      },
      asSystem(),
    ).then(response => convertIncentiveReviewItemDates(response))
  }

  getIncentiveLevels(withInactive = false): Promise<IncentiveLevel[]> {
    const query = withInactive ? { 'with-inactive': 'true' } : {}
    return this.get(
      {
        path: '/incentive/levels',
        query,
      },
      asSystem(),
    )
  }

  getIncentiveLevel(code: string): Promise<IncentiveLevel> {
    return this.get({ path: `/incentive/levels/${encodeURIComponent(code)}` }, asSystem())
  }

  /**
   * @throws SanitisedError<ErrorResponse>
   */
  createIncentiveLevel(data: IncentiveLevel): Promise<IncentiveLevel> {
    return this.post(
      {
        path: '/incentive/levels',
        data: data as unknown as Record<string, unknown>,
      },
      asSystem(),
    )
  }

  /**
   * @throws SanitisedError<ErrorResponse>
   */
  updateIncentiveLevel(levelCode: string, data: IncentiveLevelUpdate): Promise<IncentiveLevel> {
    return this.patch(
      {
        path: `/incentive/levels/${encodeURIComponent(levelCode)}`,
        data,
      },
      asSystem(),
    )
  }

  /**
   * @throws SanitisedError<ErrorResponse>
   */
  setIncentiveLevelOrder(levelCodes: string[]): Promise<IncentiveLevel[]> {
    return this.patch(
      {
        path: '/incentive/level-order',
        data: levelCodes as unknown as Record<string, unknown>,
      },
      asSystem(),
    )
  }

  getPrisonIncentiveLevels(prisonId: string, withInactive = false): Promise<PrisonIncentiveLevel[]> {
    const query = withInactive ? { 'with-inactive': 'true' } : {}
    return this.get(
      {
        path: `/incentive/prison-levels/${encodeURIComponent(prisonId)}`,
        query,
      },
      asSystem(),
    )
  }

  getPrisonIncentiveLevel(prisonId: string, levelCode: string): Promise<PrisonIncentiveLevel> {
    return this.get(
      {
        path: `/incentive/prison-levels/${encodeURIComponent(prisonId)}/level/${encodeURIComponent(levelCode)}`,
      },
      asSystem(),
    )
  }

  /**
   * @throws SanitisedError<ErrorResponse>
   */
  updatePrisonIncentiveLevel(
    prisonId: string,
    levelCode: string,
    data: PrisonIncentiveLevelUpdate,
  ): Promise<PrisonIncentiveLevel> {
    return this.patch(
      {
        path: `/incentive/prison-levels/${encodeURIComponent(prisonId)}/level/${encodeURIComponent(levelCode)}`,
        data,
      },
      asSystem(),
    )
  }

  getReviews({
    agencyId,
    locationPrefix,
    levelCode,
    sort,
    order,
    page,
    pageSize,
  }: IncentivesReviewsRequest): Promise<IncentivesReviewsResponse> {
    const prison = encodeURIComponent(agencyId)
    const location = encodeURIComponent(locationPrefix)
    return this.get<DatesAsStrings<IncentivesReviewsResponse>>(
      {
        path: `/incentives-reviews/prison/${prison}/location/${location}/level/${levelCode}`,
        query: { sort, order, page, pageSize },
      },
      asSystem(),
    ).then(response => {
      return {
        ...response,
        reviews: response.reviews.map(review => {
          return {
            ...review,
            // convert string date to js _midday_ datetime to avoid timezone offsets
            nextReviewDate: new Date(`${review.nextReviewDate}T12:00:00`),
          }
        }),
      }
    })
  }
}
