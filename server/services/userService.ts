import { convertToTitleCase } from '../utils/utils'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import { NomisUserRolesApi, type Caseload } from '../data/nomisUserRolesApi'

export interface UserDetails {
  name: string
  displayName: string
  caseloads: Array<Caseload>
  activeCaseload: Caseload
}

export default class UserService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getUser(token: string): Promise<UserDetails> {
    return this.hmppsAuthClient.getUser(token).then(user => {
      const nomisUserRolesApi = new NomisUserRolesApi(token)

      return nomisUserRolesApi.getUserCaseloads().then(uc => {
        return {
          ...user,
          displayName: convertToTitleCase(user.name),
          caseloads: uc.caseloads,
          activeCaseload: uc.activeCaseload,
        }
      })
    })
  }
}
