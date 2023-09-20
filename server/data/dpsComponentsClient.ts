import config from '../config'
import RestClient from './restClient'

export interface Component {
  html: string
  css: string[]
  javascript: string[]
}

export type AvailableComponent = 'header' | 'footer'

export default class DpsComponentsClient {
  private static restClient(token: string): RestClient {
    return new RestClient('HMPPS Components Client', config.apis.frontendComponents, token)
  }

  getComponent(component: AvailableComponent, userToken: string): Promise<Component> {
    return DpsComponentsClient.restClient(userToken).get({
      path: `/${component}`,
      headers: { 'x-user-token': userToken },
    }) as Promise<Component>
  }
}
