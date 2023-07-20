import config from '../config'
import RestClient from './restClient'

export interface Location {
  locationId: number
  locationType: string
  description: string
  agencyId: string
  currentOccupancy: number
  operationalCapacity?: number
  locationPrefix: string
  userDescription?: string
  subLocations?: boolean
}

export interface Agency {
  agencyId: string
  description: string
  agencyType: string
  active: boolean
}

export class PrisonApi extends RestClient {
  constructor(token: string) {
    super('HMPPS Prison API', config.apis.hmppsPrisonApi, token)
  }

  getImageByPrisonerNumber(prisonerNumber: string): Promise<Buffer> {
    return this.get({
      path: `/api/bookings/offenderNo/${prisonerNumber}/image/data?fullSizeImage=false`,
      handle404: true,
    })
  }

  getUserLocations(): Promise<Array<Location>> {
    return this.get<Array<Location>>({ path: '/api/users/me/locations?include-non-residential-locations=true' }).then(
      locations => {
        return locations.filter(location => {
          return location.currentOccupancy > 0
        })
      },
    )
  }

  getAgency(agencyId: string, activeOnly = true): Promise<Agency> {
    return this.get<Agency>({ path: `/api/agencies/${encodeURIComponent(agencyId)}?activeOnly=${Boolean(activeOnly)}` })
  }
}
