import nock from 'nock'

import config from '../config'
import { getTestIncentivesLocationSummary } from '../testData/incentivesApi'
import { IncentivesApi } from './incentivesApi'

const accessToken = 'test token'

describe('IncentiveApi', () => {
  let incentivesApi: nock.Scope
  let incentivesApiClient: IncentivesApi

  beforeEach(() => {
    incentivesApi = nock(config.apis.hmppsIncentivesApi.url)
    incentivesApiClient = new IncentivesApi(accessToken)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getLocationSummary()', () => {
    it('returns data from Incentives API', async () => {
      const prisonId = 'ABC'
      const locationId = 'ABC-1'
      const apiResponse = getTestIncentivesLocationSummary({ prisonId, locationId })
      incentivesApi
        .get(`/incentives-summary/prison/${prisonId}/location/${locationId}`)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, apiResponse)

      const result = await incentivesApiClient.getLocationSummary(prisonId, locationId)

      expect(result).toEqual(apiResponse)
    })
  })
})
