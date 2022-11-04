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

  getImageByPrisonerNumber(prisonerNumber: string): Promise<unknown> {
    return this.get({
      path: `/api/bookings/offenderNo/${prisonerNumber}/image/data?fullSizeImage=false`,
      handle404: true,
    })
  }

  getUserLocations(): Promise<Array<Location>> {
    return this.get<Array<Location>>({ path: `/api/users/me/locations` }).then(locations => {
      return locations.filter(location => {
        return location.currentOccupancy > 0
      })
    })
  }
}

export { PrisonApi, Location }
