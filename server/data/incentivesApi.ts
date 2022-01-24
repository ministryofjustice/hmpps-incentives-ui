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

class IncentivesApi extends RestClient {
  constructor(systemToken: string) {
    super('HMPPS Incentives API', config.apis.hmppsIncentivesApi, systemToken)
  }

  async getLocationSummary(agencyId: string, locationPrefix: string): Promise<IncentivesLocationSummary> {
    return this.get({
      path: `/incentives-summary/prison/${agencyId}/location/${locationPrefix}`,
    }) as Promise<IncentivesLocationSummary>
  }
}

export { IncentivesApi, IncentivesLocationSummary }
