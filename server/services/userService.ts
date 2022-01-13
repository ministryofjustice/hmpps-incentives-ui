import convertToTitleCase from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import { PrisonApi, CaseLoad } from '../data/prisonApi'

interface UserDetails {
  name: string
  displayName: string
  activeCaseLoads: Array<CaseLoad>
  activeCaseLoad: CaseLoad
}

export default class UserService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.hmppsAuthClient.getUser(token)

    const prisonApi = new PrisonApi(token)

    const activeCaseLoads = user.activeCaseLoadId ? await prisonApi.getUserCaseLoads() : []
    const activeCaseLoad = activeCaseLoads.find(caseLoad => caseLoad.caseLoadId === user.activeCaseLoadId)

    return {
      ...user,
      displayName: convertToTitleCase(user.name as string),
      activeCaseLoads,
      activeCaseLoad,
    }
  }
}
