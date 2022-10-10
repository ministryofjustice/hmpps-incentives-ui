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
}

export { IncentivesApi, IncentivesLocationSummary }
