import createApp from './app'
import ManageUsersApiClient from './data/manageUsersApiClient'
import UserService from './services/userService'

const manageUsersApiClient = new ManageUsersApiClient()
const userService = new UserService(manageUsersApiClient)

// eslint-disable-next-line import/prefer-default-export
export const app = createApp(userService)
