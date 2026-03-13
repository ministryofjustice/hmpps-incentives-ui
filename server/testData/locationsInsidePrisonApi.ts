import { randomUUID } from 'node:crypto'
import { TopLevelLocation } from '../data/locationsInsidePrisonApi'

export default function getTestLocation({
  locationId = randomUUID(),
  fullLocationPath = '2',
  localName = 'Houseblock 2',
  locationType = 'WING',
}: {
  locationId?: string
  fullLocationPath?: string
  localName?: string
  locationType?: string
}): TopLevelLocation {
  return {
    locationId,
    fullLocationPath,
    localName,
    locationType,
    locationCode: fullLocationPath,
    level: 1,
    status: 'ACTIVE',
  }
}
