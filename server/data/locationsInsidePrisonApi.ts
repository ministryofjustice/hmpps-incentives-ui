import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'

export interface TopLevelLocation {
  locationId: string
  locationType: string
  locationCode: string
  fullLocationPath: string
  localName?: string
  level: number
  status: string
}

export class LocationsInsidePrisonApi extends RestClient {
  constructor(token: string) {
    super('HMPPS Locations Inside Prison API', config.apis.locationsInsidePrisonApi, logger, {
      getToken: async () => token,
    })
  }

  getTopLevelPrisonLocations(prisonId: string): Promise<Array<TopLevelLocation>> {
    return this.get<Array<TopLevelLocation>>(
      {
        path: `/locations/prison/${encodeURIComponent(prisonId)}/residential-first-level`,
        query: { includeVirtualLocations: 'true' },
      },
      asSystem(),
    )
  }
}
