import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import type { TransferPrisonId, OutsidePrisonId } from './constants'
import logger from '../../logger'

interface BaseOffenderSearchResult {
  bookingId: number
  prisonerNumber: string
  firstName: string
  lastName: string
}

export interface OffenderSearchResultIn extends BaseOffenderSearchResult {
  prisonId: string
  prisonName: string
  cellLocation: string
}

export interface OffenderSearchResultTransfer extends BaseOffenderSearchResult {
  prisonId: TransferPrisonId
  prisonName: string
  locationDescription: string
}

export interface OffenderSearchResultOut extends BaseOffenderSearchResult {
  prisonId: OutsidePrisonId
  prisonName: string
  locationDescription: string
}

export type OffenderSearchResult = OffenderSearchResultIn | OffenderSearchResultTransfer | OffenderSearchResultOut

export class OffenderSearchClient extends RestClient {
  constructor(token: string) {
    super('Offender Search API', config.apis.offenderSearchApi, logger, {
      getToken: async () => token,
    })
  }

  /**
   * Find a single person by prisoner number
   */
  getPrisoner(prisonerNumber: string): Promise<OffenderSearchResult> {
    return this.get<OffenderSearchResult>(
      {
        path: `/prisoner/${encodeURIComponent(prisonerNumber)}`,
      },
      asSystem(),
    )
  }
}
