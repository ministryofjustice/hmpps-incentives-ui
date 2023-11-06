import { Response } from 'superagent'

import { stubFor } from './wiremock'
import { UserRole } from '../../server/data/manageUsersApiClient'

const stubUser = (name: string) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/users/me',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        staffId: 231232,
        username: 'USER1',
        active: true,
        name,
      },
    },
  })

const stubUserRoles = (roles: UserRole[] = [{ roleCode: 'SOME_USER_ROLE' }]) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/users/me/roles',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: roles,
    },
  })

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/health/ping',
    },
    response: {
      status: 200,
    },
  })

export default {
  stubManageUser: (
    {
      name,
      roles,
    }: {
      name: string
      roles: UserRole[]
    } = {
      name: 'john smith',
      roles: [],
    },
  ): Promise<[Response, Response]> => Promise.all([stubUser(name), stubUserRoles(roles)]),
  stubManageUsersPing: ping,
}
