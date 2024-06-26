import nock from 'nock'

import config from '../config'
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

  describe('getReviews()', () => {
    const agencyId = 'MDI'
    const locationPrefix = 'MDI-1'
    const levelCode = 'STD'

    const scenarios: { name: string; params: IncentivesReviewsPaginationAndSorting }[] = [
      { name: 'no', params: {} },
      { name: 'sorting', params: { sort: 'NEXT_REVIEW_DATE', order: 'ASC' } },
      { name: 'pagination', params: { page: 2, pageSize: 10 } },
      { name: 'all', params: { sort: 'NEGATIVE_BEHAVIOURS', order: 'DESC', page: 3, pageSize: 20 } },
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
          levels: [
            {
              levelCode: 'BAS',
              levelName: 'Basic',
              reviewCount: 0,
              overdueCount: 0,
            },
            {
              levelCode: 'STD',
              levelName: 'Standard',
              reviewCount: 0,
              overdueCount: 0,
            },
            {
              levelCode: 'ENH',
              levelName: 'Enhanced',
              reviewCount: 0,
              overdueCount: 0,
            },
          ],
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
        levels: [
          {
            levelCode: 'BAS',
            levelName: 'Basic',
            reviewCount: 0,
            overdueCount: 0,
          },
          {
            levelCode: 'STD',
            levelName: 'Standard',
            reviewCount: 0,
            overdueCount: 0,
          },
          {
            levelCode: 'ENH',
            levelName: 'Enhanced',
            reviewCount: 0,
            overdueCount: 0,
          },
        ],
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
          levels: [
            {
              levelCode: 'BAS',
              levelName: 'Basic',
              reviewCount: 10,
              overdueCount: 0,
            },
            {
              levelCode: 'STD',
              levelName: 'Standard',
              reviewCount: 1,
              overdueCount: 0,
            },
            {
              levelCode: 'ENH',
              levelName: 'Enhanced',
              reviewCount: 10,
              overdueCount: 2,
            },
          ],
          reviews: [
            {
              firstName: 'Flem',
              lastName: 'Hermosilla',
              levelCode,
              prisonerNumber: 'G5992UH',
              bookingId: 100001,
              nextReviewDate: '2023-09-10',
              daysSinceLastReview: 2,
              positiveBehaviours: 2,
              negativeBehaviours: 0,
              hasAcctOpen: false,
              isNewToPrison: false,
            },
          ],
        })

      const result = await incentivesApiClient.getReviews({ agencyId, locationPrefix, levelCode })
      expect(result).toEqual<IncentivesReviewsResponse>({
        locationDescription: '1 wing',
        overdueCount: 2,
        reviewCount: 1,
        levels: [
          {
            levelCode: 'BAS',
            levelName: 'Basic',
            reviewCount: 10,
            overdueCount: 0,
          },
          {
            levelCode: 'STD',
            levelName: 'Standard',
            reviewCount: 1,
            overdueCount: 0,
          },
          {
            levelCode: 'ENH',
            levelName: 'Enhanced',
            reviewCount: 10,
            overdueCount: 2,
          },
        ],
        reviews: [
          {
            firstName: 'Flem',
            lastName: 'Hermosilla',
            levelCode,
            prisonerNumber: 'G5992UH',
            bookingId: 100001,
            nextReviewDate: new Date(2023, 8, 10, 12),
            daysSinceLastReview: 2,
            positiveBehaviours: 2,
            negativeBehaviours: 0,
            hasAcctOpen: false,
            isNewToPrison: false,
          },
        ],
      })
    })
  })
})
