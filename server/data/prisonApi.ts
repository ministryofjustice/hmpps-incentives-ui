import config from '../config'
import RestClient from './restClient'

interface CaseLoad {
  caseLoadId: string
  description: string
  currentlyActive: boolean
  type: string
}

class PrisonApi extends RestClient {
  constructor(token: string) {
    super('HMPPS Prison API', config.apis.hmppsPrisonApi, token)
  }

  async getUserCaseLoads(): Promise<Array<CaseLoad>> {
    return this.get({ path: '/users/me/caseLoads' }) as Promise<Array<CaseLoad>>
  }
}

export default PrisonApi
