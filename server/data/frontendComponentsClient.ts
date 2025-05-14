import { RestClient, asUser } from '@ministryofjustice/hmpps-rest-client'

import logger from '../../logger'
import config from '../config'

export interface Component {
  html: string
  css: string[]
  javascript: string[]
}

export type AvailableComponent = 'header' | 'footer'

export interface CaseLoad {
  caseLoadId: string
  description: string
  type: string
  caseloadFunction: string
  currentlyActive: boolean
}

export interface Service {
  id: string
  heading: string
  description: string
  href: string
  navEnabled: boolean
}

export interface ComponentsResponse extends Record<AvailableComponent, Component> {
  meta: {
    activeCaseLoad: CaseLoad
    caseLoads: CaseLoad[]
    services: Service[]
  }
}

export default class FrontendComponentsClient extends RestClient {
  constructor() {
    super('HMPPS Components Client', config.apis.frontendComponents, logger)
  }

  getComponents<T extends AvailableComponent[]>(
    components: T,
    userToken: string,
  ): Promise<Pick<ComponentsResponse, 'meta' | T[number]>> {
    return this.get(
      {
        path: '/components',
        query: { component: components },
        headers: { 'x-user-token': userToken },
      },
      asUser(userToken),
    )
  }
}
