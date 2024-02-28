import superagent, { type SuperAgentRequest, type Response } from 'superagent'

const url = 'http://localhost:9091/__admin'

export const stubFor = (mapping: Record<string, unknown>): SuperAgentRequest =>
  superagent.post(`${url}/mappings`).send(mapping)

export const getMatchingRequests = (body: string | object) => superagent.post(`${url}/requests/find`).send(body)

export const resetStubs = (): Promise<Array<Response>> =>
  Promise.all([superagent.delete(`${url}/mappings`), superagent.delete(`${url}/requests`)])
