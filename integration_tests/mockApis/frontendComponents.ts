import type { Response } from 'superagent'

import { stubFor } from './wiremock'
import type { Component, AvailableComponent } from '../../server/data/frontendComponentsClient'

const stubComponent = (name: AvailableComponent, component: Component): Promise<Response> =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: `/frontendComponents/${name}`,
    },
    response: {
      headers: { 'Content-Type': 'application/json' },
      jsonBody: component,
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
  stubFallbackHeaderAndFooter(): Promise<Response[]> {
    const empty: Component = {
      html: '',
      css: [],
      javascript: [],
    }
    return Promise.all([stubComponent('header', empty), stubComponent('footer', empty)])
  },
  stubFrontendComponentsHeaderAndFooter(): Promise<Response[]> {
    return Promise.all([
      stubCSS('header', 'header { background: red }'),
      stubCSS('footer', 'footer { background: yellow }'),
      stubJavascript('header', 'window.FrontendComponentsHeaderDidLoad = true;'),
      stubJavascript('footer', 'window.FrontendComponentsFooterDidLoad = true;'),
      stubComponent('header', {
        html: '<header>HEADER</header>',
        css: ['http://localhost:9091/frontendComponents/header.css'],
        javascript: ['http://localhost:9091/frontendComponents/header.js'],
      }),
      stubComponent('footer', {
        html: '<footer>FOOTER</footer>',
        css: ['http://localhost:9091/frontendComponents/footer.css'],
        javascript: ['http://localhost:9091/frontendComponents/footer.js'],
      }),
    ])
  },
}
