import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'

import config from '../config'
import logger from '../../logger'

export interface Caseload {
  id: string
  name: string
}

export interface UserCaseload {
  activeCaseload: Caseload
  caseloads: Array<Caseload>
}

export class NomisUserRolesApi extends RestClient {
  constructor(token: string) {
    super('NOMIS User Roles API', config.apis.nomisUserRolesApi, logger, {
      getToken: async () => token,
    })
  }

  getUserCaseloads(): Promise<UserCaseload> {
    return this.get<UserCaseload>({ path: '/me/caseloads' }, asSystem()).then(userCaseload => {
      return {
        activeCaseload: userCaseload.activeCaseload,
        caseloads: userCaseload.caseloads,
      }
    })
  }
}
