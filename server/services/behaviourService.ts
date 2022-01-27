import { IncentivesApi, IncentivesLocationSummary } from '../data/incentivesApi'

export default class BehaviourService {
  private readonly incentivesApi: IncentivesApi

  constructor(systemToken: string) {
    this.incentivesApi = new IncentivesApi(systemToken)
  }

  async getLocationSummary(agencyId: string, locationPrefix: string): Promise<IncentivesLocationSummary> {
    return this.incentivesApi.getLocationSummary(agencyId, locationPrefix)
  }
}
