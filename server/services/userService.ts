import { convertToTitleCase } from '../utils/utils'
import { NomisUserRolesApi, type UserCaseload } from '../data/nomisUserRolesApi'
import type { User } from '../data/manageUsersApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'

export interface UserDetails extends User, UserCaseload {
  displayName: string
}

export default class UserService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  async getUser(token: string): Promise<UserDetails> {
    return this.manageUsersApiClient.getUser(token).then(user => {
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
