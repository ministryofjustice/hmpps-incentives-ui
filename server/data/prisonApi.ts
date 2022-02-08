import config from '../config'
import RestClient from './restClient'

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

  async getImage(imageId: string): Promise<unknown> {
    return this.get({ path: `/api/images/${imageId}/data` })
  }

  async getUserLocations(): Promise<Array<Location>> {
    const locations = (await this.get({ path: `/api/users/me/locations` })) as Array<Location>

    // Only return occupied locations
    return locations.filter(location => {
      return location.currentOccupancy > 0
    })
  }
}

export { PrisonApi, Location }
