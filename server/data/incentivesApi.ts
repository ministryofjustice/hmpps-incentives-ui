import config from '../config'
import RestClient from './restClient'

interface IncentivesPrisonerSummary {
  prisonerNumber: string
  bookingId: number
  firstName: string
  lastName: string
  daysOnLevel: number
  daysSinceLastReview: number
  positiveBehaviours: number
  incentiveEncouragements: number
  negativeBehaviours: number
  incentiveWarnings: number
  provenAdjudications: number
}

interface IncentivesLevelSummary {
  level: string
  levelDescription: string
  numberAtThisLevel: number
  prisonerBehaviours: Array<IncentivesPrisonerSummary>
}

export interface IncentivesLocationSummary {
  prisonId: string
  locationId: string
  locationDescription: string
  totalPositiveBehaviours: number
  totalNegativeBehaviours: number
  totalIncentiveEncouragements: number
  totalIncentiveWarnings: number
  incentiveLevelSummary: Array<IncentivesLevelSummary>
}

export interface Level {
  iepLevel: string
  iepDescription: string
  sequence: number
  default: boolean
}

// NB: Reviews request field names are TBC
export const sortOptions = ['name', 'nextReviewDate', 'positiveBehaviours', 'negativeBehaviours', 'acctStatus'] as const
export const orderOptions = ['asc', 'desc'] as const

// NB: Reviews request field names are TBC
export type IncentivesReviewsPaginationAndSorting = {
  sort?: typeof sortOptions[number]
  order?: typeof orderOptions[number]
  page?: number
  pageSize?: number
}

// NB: Reviews request field names are TBC
export type IncentivesReviewsRequest = {
  agencyId: string
  locationPrefix: string
  levelCode: string
} & IncentivesReviewsPaginationAndSorting

// NB: Reviews response field names are TBC
export interface IncentivesReviewsResponse {
  locationDescription: string
  overdueCount: number
  reviewCount: number
  reviews: IncentivesReview[]
}

// NB: Reviews response field names are TBC
export interface IncentivesReview {
  firstName: string
  lastName: string
  levelCode: string
  prisonerNumber: string
  bookingId: number
  nextReviewDate: Date
  positiveBehaviours: number
  negativeBehaviours: number
  acctStatus: boolean
}

export class IncentivesApi extends RestClient {
  constructor(systemToken: string) {
    super('HMPPS Incentives API', config.apis.hmppsIncentivesApi, systemToken)
  }

  getLocationSummary(agencyId: string, locationPrefix: string): Promise<IncentivesLocationSummary> {
    return this.get<IncentivesLocationSummary>({
      path: `/incentives-summary/prison/${agencyId}/location/${locationPrefix}?sortBy=NAME&sortDirection=ASC`,
    })
  }

  getAvailableLevels(agencyId: string): Promise<Level[]> {
    return this.get<Level[]>({ path: `/iep/levels/${agencyId}` })
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
    return this.get<IncentivesReviewsResponse>({
      path: `/incentives-reviews/prison/${prison}/location/${location}/level/${levelCode}`,
      query: { sort, order, page, pageSize },
    }).then(response => {
      response.reviews = response.reviews.map(review => {
        // convert string date to js _midday_ datetime to avoid timezone offsets
        const nextReviewDate = review.nextReviewDate as unknown as string
        // eslint-disable-next-line no-param-reassign
        review.nextReviewDate = new Date(`${nextReviewDate}T12:00:00`)
        return review
      })
      return response
    })
  }
}
