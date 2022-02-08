import convertToTitleCase from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import { NomisUserRolesApi, Caseload } from '../data/nomisUserRolesApi'

interface UserDetails {
  name: string
  displayName: string
  caseloads: Array<Caseload>
  activeCaseload: Caseload
}

export default class UserService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.hmppsAuthClient.getUser(token)

    const nomisUserRolesApi = new NomisUserRolesApi(token)

    const userCaseloads = await nomisUserRolesApi.getUserCaseloads()

    return {
      ...user,
      displayName: convertToTitleCase(user.name as string),
      caseloads: userCaseloads.caseloads,
      activeCaseload: userCaseloads.activeCaseload,
    }
  }
}
