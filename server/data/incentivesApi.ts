import config from '../config'
import RestClient from './restClient'
import { getTestIncentivesReviews } from '../testData/incentivesApi'

interface IncentivesPrisonerSummary {
  prisonerNumber: string
  bookingId: number
  imageId: number
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

interface IncentivesLocationSummary {
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
export type IncentivesReviewsRequest = {
  agencyId: string
  locationPrefix: string
  levelCode: string
  sort?: string
  order?: 'ascending' | 'descending'
  page?: number
  pageSize?: number
}

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
  prisonerNumber: string
  bookingId: number
  imageId: number
  nextReviewDate: Date
  positiveBehaviours: number
  negativeBehaviours: number
  acctStatus: boolean
}

class IncentivesApi extends RestClient {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    agencyId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    locationPrefix,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    levelCode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sort,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    order,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    page,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pageSize,
  }: IncentivesReviewsRequest): Promise<IncentivesReviewsResponse> {
    // TODO: this is a stub!!!
    return Promise.resolve(getTestIncentivesReviews())
  }
}

export { IncentivesApi, IncentivesLocationSummary }
