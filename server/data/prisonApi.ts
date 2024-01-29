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

export interface Staff {
  firstName: string
  lastName: string
  staffId: number
  username: string
  activeCaseLoadId: string
  active: boolean
}

export interface AssignedLivingUnit {
  agencyId: string
  locationId: number
  description: string
  agencyName: string
}

export interface Offender {
  offenderNo: string
  bookingId: number
  firstName: string
  lastName: string
  agencyId: string
  assignedLivingUnit: AssignedLivingUnit
}

export class PrisonApi extends RestClient {
  constructor(token: string) {
    super('HMPPS Prison API', config.apis.hmppsPrisonApi, token)
  }

  getImageByPrisonerNumber(prisonerNumber: string): Promise<Buffer | null> {
    return this.get<Buffer>({
      path: `/api/bookings/offenderNo/${encodeURIComponent(prisonerNumber)}/image/data`,
      query: { fullSizeImage: 'false' },
    }).catch(error => {
      const status = error?.status
      if (status === 403 || status === 404) {
        // return null if unauthorised or not found
        return null
      }
      throw error
    })
  }

  getUserLocations(): Promise<Array<Location>> {
    return this.get<Array<Location>>({
      path: '/api/users/me/locations',
      query: { 'include-non-residential-locations': 'true' },
    }).then(locations => {
      return locations.filter(location => {
        return location.currentOccupancy > 0
      })
    })
  }

  getAgency(agencyId: string, activeOnly = true): Promise<Agency> {
    return this.get<Agency>({
      path: `/api/agencies/${encodeURIComponent(agencyId)}}`,
      query: { activeOnly: activeOnly.toString() },
    })
  }

  getStaffDetails(staffId: string): Promise<Staff> {
    return this.get<Staff>({
      path: `/api/users/${encodeURIComponent(staffId)}`,
    })
  }

  getPrisonerDetails(prisonerNumber: string): Promise<Offender> {
    return this.get<Offender>({
      path: `/api/bookings/offenderNo/${encodeURIComponent(prisonerNumber)}`,
    })
  }

  getFullDetails(prisonerNumber: string, fullInfo: boolean): Promise<Offender> {
    return this.get<Offender>({
      path: `/api/bookings/offenderNo/${encodeURIComponent(prisonerNumber)}`,
      query: { fullInfo: fullInfo.toString(), csraSummary: fullInfo.toString() },
    })
  }
}
