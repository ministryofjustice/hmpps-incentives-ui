import type { Response } from 'superagent'

import { stubFor } from './wiremock'
import type { AvailableComponent, Component } from '../../server/data/frontendComponentsClient'
import { mockFrontendComponentResponse } from '../../server/testData/frontendComponents'

const stubComponents = (components: Partial<Record<AvailableComponent, Component>> = {}): Promise<Response> =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/frontendComponents/components',
      queryParameters: {
        component: { includes: Object.keys(components).map(component => ({ equalTo: component })) },
      },
    },
    response: {
      headers: { 'Content-Type': 'application/json' },
      jsonBody: mockFrontendComponentResponse(components),
    },
  })

const stubCSS = (name: AvailableComponent, css: string): Promise<Response> =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: `/frontendComponents/${name}.css`,
    },
    response: {
      headers: {
        'Content-Type': 'text/css',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
      body: css,
    },
  })

const stubJavascript = (name: AvailableComponent, js: string): Promise<Response> =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: `/frontendComponents/${name}.js`,
    },
    response: {
      headers: {
        'Content-Type': 'text/javascript',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
      body: js,
    },
  })

export default {
  stubFallbackHeaderAndFooter(): Promise<Response> {
    return stubComponents()
  },
  stubFrontendComponentsHeaderAndFooter(): Promise<Response[]> {
    return Promise.all([
      stubCSS('header', 'header { background: red }'),
      stubCSS('footer', 'footer { background: yellow }'),
      stubJavascript('header', 'window.FrontendComponentsHeaderDidLoad = true;'),
      stubJavascript('footer', 'window.FrontendComponentsFooterDidLoad = true;'),
      stubComponents({
        header: {
          html: '<header>HEADER</header>',
          css: ['http://localhost:9091/frontendComponents/header.css'],
          javascript: ['http://localhost:9091/frontendComponents/header.js'],
        },
        footer: {
          html: '<footer>FOOTER</footer>',
          css: ['http://localhost:9091/frontendComponents/footer.css'],
          javascript: ['http://localhost:9091/frontendComponents/footer.js'],
        },
      }),
    ])
  },
  stubFrontendComponentsApiPing(): Promise<Response> {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/frontendComponents/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },
}
