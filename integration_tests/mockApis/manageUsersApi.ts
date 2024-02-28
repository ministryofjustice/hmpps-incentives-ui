import { stubFor } from './wiremock'

const stubUser = (name: string = 'john smith') =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/manage-users-api/users/me',
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

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/manage-users-api/health/ping',
    },
    response: {
      status: 200,
    },
  })

export default {
  stubManageUser: stubUser,
  stubManageUsersPing: ping,
}
