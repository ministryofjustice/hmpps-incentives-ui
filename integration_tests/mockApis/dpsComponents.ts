import { Response } from 'superagent'
import { stubFor } from './wiremock'

const stubHeaderFail = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/components/header',
    },
    response: {
      status: 500,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    },
  })

const stubFooterFail = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/components/footer',
    },
    response: {
      status: 500,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    },
  })

export default {
  stubDpsComponentsFail: (): Promise<[Response, Response]> => Promise.all([stubHeaderFail(), stubFooterFail()]),
}
