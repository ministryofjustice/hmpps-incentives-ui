import config from '../config'
import RestClient from './restClient'

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

export interface IncentivesReviews {
  locationDescription: string
  overdueCount: number
  reviewCount: number
  reviews: IncentivesReview[]
}

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
    return this.get({
      path: `/incentives-summary/prison/${agencyId}/location/${locationPrefix}?sortBy=NAME&sortDirection=ASC`,
    }) as Promise<IncentivesLocationSummary>
  }

  getAvailableLevels(agencyId: string): Promise<Level[]> {
    return this.get({ path: `/iep/levels/${agencyId}` }) as Promise<Level[]>
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getReviews(agencyId: string, locationPrefix: string, levelCode: string): Promise<IncentivesReviews> {
    // TODO: this is a stub!!!
    return Promise.resolve({
      locationDescription: 'Houseblock 1',
      overdueCount: 16,
      reviewCount: 135,
      reviews: [
        {
          firstName: 'John',
          lastName: 'Saunders',
          prisonerNumber: 'G6123VU',
          bookingId: 100000,
          imageId: 0,
          nextReviewDate: new Date(2022, 6, 12),
          positiveBehaviours: 3,
          negativeBehaviours: 2,
          acctStatus: true,
        },
        {
          firstName: 'Flem',
          lastName: 'Hermosilla',
          prisonerNumber: 'G5992UH',
          bookingId: 100001,
          imageId: 0,
          nextReviewDate: new Date(2023, 9, 10),
          positiveBehaviours: 2,
          negativeBehaviours: 0,
          acctStatus: false,
        },
      ],
    })
  }
}

export { IncentivesApi, IncentivesLocationSummary }
