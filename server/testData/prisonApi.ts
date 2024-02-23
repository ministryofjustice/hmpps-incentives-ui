import type { Agency, Location } from '../data/prisonApi'
import { Offender, Staff } from '../data/prisonApi'

export const sampleAgencies: Record<string, Agency> = {
  LEI: {
    agencyId: 'LEI',
    description: 'Leeds (HMP)',
    agencyType: 'INST',
    active: true,
  },
  MDI: {
    agencyId: 'MDI',
    description: 'Moorland (HMP & YOI)',
    agencyType: 'INST',
    active: true,
  },
  WRI: {
    agencyId: 'WRI',
    description: 'Whitemoor (HMP & YOI)',
    agencyType: 'INST',
    active: true,
  },
}

export const prisonerDetails: Offender = {
  offenderNo: 'A8083DY',
  agencyId: 'MDI',
  bookingId: 12345,
  firstName: 'John',
  lastName: 'Smith',
  assignedLivingUnit: {
    agencyId: 'MDI',
    locationId: 161863,
    description: '1-2-003',
    agencyName: 'Moorland (HMP & YOI)',
  },
}
export const prisonerInLeedsDetails: Offender = {
  offenderNo: 'A2409AE',
  agencyId: 'LEI',
  bookingId: 12367,
  firstName: 'Fred',
  lastName: 'Mills',
  assignedLivingUnit: {
    agencyId: 'LEI',
    locationId: 75192,
    description: '4-2-013',
    agencyName: 'Leeds (HMP)',
  },
}

export const staffDetails: Staff = {
  firstName: 'Mary',
  lastName: 'Scott',
  staffId: 4826,
  username: 'NOMIS_USER',
  activeCaseLoadId: 'MDI',
  active: true,
}

export const agencyDetails: Agency = {
  agencyId: 'MDI',
  description: 'Moorland (HMP & YOI)',
  agencyType: 'INST',
  active: true,
}

export function getAgencyMockImplementation(agencyId: string): Promise<Agency> {
  return new Promise((resolve, reject) => {
    if (agencyId in sampleAgencies) {
      resolve(sampleAgencies[agencyId])
    } else {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject({ status: 404, message: 'Not Found' })
    }
  })
}

export function getTestLocation({
  agencyId = 'MDI',
  locationId = 2,
  locationPrefix = 'MDI-2',
  userDescription = 'Houseblock 2',
}: {
  agencyId?: string
  locationId?: number
  locationPrefix?: string
  userDescription?: string
  subLocations: true
}): Location {
  return {
    agencyId,
    locationPrefix,
    userDescription,
    locationId,
    locationType: 'WING',
    description: '2',
    currentOccupancy: 199,
    operationalCapacity: 200,
  }
}
