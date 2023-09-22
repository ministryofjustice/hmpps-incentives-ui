import ComponentService from './dpsComponenetService'
import UserService from './userService'
import { dataAccess } from '../data'
export const services = () => {
    const { hmppsAuthClient, componentApiClientBuilder, applicationInfo } = dataAccess()

    const userService = new UserService(hmppsAuthClient)

    const componentService = new ComponentService(componentApiClientBuilder)

    return {
      userService,
      applicationInfo,
      hmppsAuthClient,
      componentService
    }
}

export type Services = ReturnType<typeof services>



