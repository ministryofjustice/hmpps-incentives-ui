import config from '../config'
import RestClient from './restClient'

interface CaseLoad {
  caseLoadId: string
  description: string
  currentlyActive: boolean
  type: string
}

interface Location {
  locationId: number
  locationType: string
  description: string
  agencyId: string
  currentOccupancy: number
  operationalCapacity?: number
  locationPrefix: string
  userDescription?: string
}

class PrisonApi extends RestClient {
  constructor(token: string) {
    super('HMPPS Prison API', config.apis.hmppsPrisonApi, token)
  }

  async getUserCaseLoads(): Promise<Array<CaseLoad>> {
    return this.get({ path: '/api/users/me/caseLoads' }) as Promise<Array<CaseLoad>>
  }

  async getUserLocations(): Promise<Array<Location>> {
    const locations = (await this.get({ path: `/api/users/me/locations` })) as Array<Location>

    // Only return occupied wings
    return locations.filter(location => {
      return location.locationType === 'WING' && location.currentOccupancy > 0
    })
  }
}

export { PrisonApi, CaseLoad, Location }
