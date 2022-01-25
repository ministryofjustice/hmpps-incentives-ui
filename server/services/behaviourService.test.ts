import BehaviourService from './behaviourService'
import { IncentivesApi } from '../data/incentivesApi'
import { getTestIncentivesLocationSummary } from '../testData/incentivesApi'

jest.mock('../data/incentivesApi')

describe('BehaviourService', () => {
  let incentivesApi: jest.Mocked<IncentivesApi>
  let behaviourService: BehaviourService

  const locationSummaryResponse = getTestIncentivesLocationSummary({
    prisonId: 'MDI',
    locationId: 'MDI-123',
  })

  beforeEach(() => {
    incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
    incentivesApi.getLocationSummary.mockResolvedValue(locationSummaryResponse)

    behaviourService = new BehaviourService('test system token')
  })

  describe('getLocationSummary()', () => {
    it(`calls PrisonApi's getLocationSummary() with correct prison/location`, async () => {
      const agencyId = 'MDI'
      const locationPrefix = 'MDI-123'
      await behaviourService.getLocationSummary(agencyId, locationPrefix)

      expect(incentivesApi.getLocationSummary).toHaveBeenCalledWith(agencyId, locationPrefix)
    })

    it(`returns PrisonApi's getLocationSummary() response`, async () => {
      const result = await behaviourService.getLocationSummary('MDI', 'MDI-123')

      expect(result).toEqual(locationSummaryResponse)
    })
  })
})
