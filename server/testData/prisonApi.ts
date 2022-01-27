import { Location } from '../data/prisonApi'

function getTestLocation({
  agencyId = 'MDI',
  locationId = 2,
  locationPrefix = 'MDI-2',
  userDescription = 'Houseblock 2',
}: {
  agencyId?: string
  locationId?: number
  locationPrefix?: string
  userDescription?: string
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

// eslint-disable-next-line import/prefer-default-export
export { getTestLocation }
