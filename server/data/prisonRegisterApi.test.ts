import nock from 'nock'

import config from '../config'
import PrisonRegisterApi, { type Prison } from './prisonRegisterApi'

const MDI: Prison = {
  prisonId: 'MDI',
  prisonName: 'Moorland (HMP/YOI)',
  active: true,
  female: false,
  male: true,
  types: [
    { code: 'HMP', description: 'Her Majesty’s Prison' },
    { code: 'YOI', description: 'Her Majesty’s Youth Offender Institution' },
  ],
  addresses: [],
}

describe('Prison Register API client', () => {
  let mockedApi: nock.Scope
  let client: PrisonRegisterApi

  beforeEach(() => {
    mockedApi = nock(config.apis.prisonRegisterApi.url)
    client = new PrisonRegisterApi()
  })

  afterEach(() => {
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  it('can list all prisons without trying to use credentials', async () => {
    const mockResponse: Prison[] = [MDI]
    mockedApi.get('/prisons').reply(function mockedReply() {
      expect(this.req.headers.authorization).toBeUndefined()
      return [200, mockResponse]
    })

    const response = client.getPrisonList()
    await expect(response).resolves.toEqual<Prison[]>(mockResponse)
  })

  it('searches active prisons by default without trying to use credentials', async () => {
    const mockResponse: Prison[] = [MDI]
    mockedApi
      .get('/prisons/search')
      .query({ active: 'true' })
      .reply(function mockedReply() {
        expect(this.req.headers.authorization).toBeUndefined()
        return [200, mockResponse]
      })

    const response = client.searchPrisons()
    await expect(response).resolves.toEqual<Prison[]>(mockResponse)
  })

  it('searches active prisons by multiple types', async () => {
    const mockResponse: Prison[] = [MDI]
    mockedApi
      .get('/prisons/search')
      .query({ active: 'true', prisonTypeCodes: ['YOI', 'STC'] })
      .reply(function mockedReply() {
        expect(this.req.headers.authorization).toBeUndefined()
        return [200, mockResponse]
      })

    const response = client.searchPrisons({ prisonTypeCodes: ['YOI', 'STC'] })
    await expect(response).resolves.toEqual<Prison[]>(mockResponse)
  })
})
