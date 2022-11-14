import nock from 'nock'

import config from '../config'
import { getTestIncentivesLocationSummary } from '../testData/incentivesApi'
import {
  IncentivesApi,
  type IncentivesReviewsResponse,
  type IncentivesReviewsPaginationAndSorting,
} from './incentivesApi'

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
        .get(`/incentives-summary/prison/${prisonId}/location/${locationId}?sortBy=NAME&sortDirection=ASC`)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, apiResponse)

      const result = await incentivesApiClient.getLocationSummary(prisonId, locationId)

      expect(result).toEqual(apiResponse)
    })
  })

  describe('getReviews()', () => {
    const agencyId = 'MDI'
    const locationPrefix = 'MDI-1'
    const levelCode = 'STD'

    const scenarios: { name: string; params: IncentivesReviewsPaginationAndSorting }[] = [
      { name: 'no', params: {} },
      { name: 'sorting', params: { sort: 'nextReviewDate', order: 'ascending' } },
      { name: 'pagination', params: { page: 2, pageSize: 10 } },
      { name: 'all', params: { sort: 'negativeBehaviours', order: 'descending', page: 3, pageSize: 20 } },
    ]
    it.each(scenarios)('passes $name query params to Incentives API', async ({ params }) => {
      incentivesApi
        .get(`/incentives-reviews/prison/${agencyId}/location/${locationPrefix}/level/${levelCode}`)
        .query(params)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, {
          locationDescription: '1 wing',
          overdueCount: 0,
          reviewCount: 0,
          reviews: [],
        })

      const result = await incentivesApiClient.getReviews({
        agencyId,
        locationPrefix,
        levelCode,
        ...params,
      })
      expect(result).toEqual<IncentivesReviewsResponse>({
        locationDescription: '1 wing',
        overdueCount: 0,
        reviewCount: 0,
        reviews: [],
      })
    })

    it('parses dates from Incentives API', async () => {
      incentivesApi
        .get(`/incentives-reviews/prison/${agencyId}/location/${locationPrefix}/level/${levelCode}`)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, {
          locationDescription: '1 wing',
          overdueCount: 2,
          reviewCount: 1,
          reviews: [
            {
              firstName: 'Flem',
              lastName: 'Hermosilla',
              levelCode,
              prisonerNumber: 'G5992UH',
              bookingId: 100001,
              nextReviewDate: '2023-09-10',
              positiveBehaviours: 2,
              negativeBehaviours: 0,
              acctStatus: false,
            },
          ],
        })

      const result = await incentivesApiClient.getReviews({ agencyId, locationPrefix, levelCode })
      expect(result).toEqual<IncentivesReviewsResponse>({
        locationDescription: '1 wing',
        overdueCount: 2,
        reviewCount: 1,
        reviews: [
          {
            firstName: 'Flem',
            lastName: 'Hermosilla',
            levelCode,
            prisonerNumber: 'G5992UH',
            bookingId: 100001,
            nextReviewDate: new Date(2023, 8, 10, 12),
            positiveBehaviours: 2,
            negativeBehaviours: 0,
            acctStatus: false,
          },
        ],
      })
    })
  })
})
