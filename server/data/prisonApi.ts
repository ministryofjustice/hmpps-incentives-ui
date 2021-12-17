import config from '../config'
import RestClient from './restClient'

interface CaseLoad {
  caseLoadId: string
  description: string
  currentlyActive: boolean
  type: string
}

// Possibly not an exhaustive list
type LocationType =
  | 'AREA'
  | 'ADJU'
  | 'ASSO'
  | 'SPOR'
  | 'LOCA'
  | 'STOR'
  | 'CLAS'
  | 'WORK'
  | 'EXER'
  | 'IGRO'
  | 'RESI'
  | 'ROOM'
  | 'WING'
  | 'MEDI'
  | 'CELL'
  | 'INTE'
  | 'BOX'
  | 'RTU'
  | 'VIDE'
  | 'TRAI'
  | 'LAND'
  | 'SPUR'
  | 'HOLD'

interface Location {
  locationId: number
  locationType: LocationType
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
    return this.get({ path: '/users/me/caseLoads' }) as Promise<Array<CaseLoad>>
  }

  async getAgencyLocations(agencyId: string): Promise<Array<Location>> {
    const locations = (await this.get({ path: `/agencies/${agencyId}/locations` })) as Array<Location>

    // Only return occupied wings
    return locations.filter(location => {
      return location.locationType === 'WING' && location.currentOccupancy > 0
    })
  }
}

export { PrisonApi, CaseLoad, Location }
