import type { Agency, Location } from '../data/prisonApi'

export const sampleAgencies: Record<string, Agency> = {
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
