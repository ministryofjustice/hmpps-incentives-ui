import logger from '../../logger'
import config from '../config'
import RestClient from './restClient'

export interface Component {
  html: string
  css: string[]
  javascript: string[]
}

export type AvailableComponent = 'header' | 'footer'

export default class FrontendComponentsClient {
  private static restClient(token: string): RestClient {
    return new RestClient('HMPPS Components Client', config.apis.frontendComponents, token)
  }

  getComponent(component: AvailableComponent, userToken: string): Promise<Component> {
    logger.info(`Getting frontend component ${component}`)
    return FrontendComponentsClient.restClient(userToken).get<Component>({
      path: `/${component}`,
      headers: { 'x-user-token': userToken },
    })
  }
}
