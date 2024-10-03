import type { AvailableComponent, CaseLoad, Component, ComponentsResponse } from '../data/frontendComponentsClient'
import { agencyDetails } from './prisonApi'

const emptyComponent: Component = {
  html: '',
  css: [],
  javascript: [],
}

const caseload: CaseLoad = {
  caseLoadId: agencyDetails.agencyId,
  description: agencyDetails.description,
  type: agencyDetails.agencyType,
  caseloadFunction: 'GENERAL',
  currentlyActive: true,
}

// eslint-disable-next-line import/prefer-default-export
export function mockFrontendComponentResponse(
  components: Partial<Record<AvailableComponent, Component>> = {},
): ComponentsResponse {
  return {
    header: emptyComponent,
    footer: emptyComponent,
    ...components,
    meta: {
      activeCaseLoad: caseload,
      caseLoads: [caseload],
      services: [],
    },
  }
}
