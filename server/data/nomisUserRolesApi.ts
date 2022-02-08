import config from '../config'
import RestClient from './restClient'

interface Caseload {
  id: string
  name: string
}

interface UserCaseload {
  activeCaseload: Caseload
  caseloads: Array<Caseload>
}

class NomisUserRolesApi extends RestClient {
  constructor(token: string) {
    super('NOMIS User Roles API', config.apis.nomisUserRolesApi, token)
  }

  async getUserCaseloads(): Promise<UserCaseload> {
    const userCaseload = (await this.get({ path: '/me/caseloads' })) as UserCaseload

    const caseloads = userCaseload.caseloads.filter(caseload => {
      return caseload.id !== 'NWEB'
    })
    return {
      activeCaseload: userCaseload.activeCaseload,
      caseloads,
    }
  }
}

export { NomisUserRolesApi, UserCaseload, Caseload }
