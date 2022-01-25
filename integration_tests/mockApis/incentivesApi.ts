import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubPing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/incentivesApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },
  stubGetLocationSummary: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/incentivesApi/incentives-summary/prison/MDI/location/MDI-42',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          prisonId: 'MDI',
          locationId: 'MDI-42',
          locationDescription: 'Houseblock 42',
          totalPositiveBehaviours: 42,
          totalNegativeBehaviours: 42,
          totalIncentiveEncouragements: 42,
          totalIncentiveWarnings: 42,
          incentiveLevelSummary: [
            {
              level: 'BAS',
              levelDescription: 'Basic',
              numberAtThisLevel: 1,
              prisonerBehaviours: [
                {
                  prisonerNumber: 'A1234AB',
                  bookingId: 111111,
                  imageId: 222222,
                  firstName: 'Jane',
                  lastName: 'Doe',
                  daysOnLevel: 10,
                  daysSinceLastReview: 50,
                  positiveBehaviours: 6,
                  incentiveEncouragements: 1,
                  negativeBehaviours: 3,
                  incentiveWarnings: 1,
                  provenAdjudications: 2,
                },
              ],
            },
          ],
        },
      },
    })
  },
}
