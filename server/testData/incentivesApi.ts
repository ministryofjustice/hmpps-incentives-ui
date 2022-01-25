import { IncentivesLocationSummary } from '../data/incentivesApi'

function getTestIncentivesLocationSummary({
  prisonId = 'MDI',
  locationId = 'MDI-2',
  locationDescription = 'Houseblock 2',
}: {
  prisonId?: string
  locationId?: string
  locationDescription?: string
}): IncentivesLocationSummary {
  return {
    prisonId,
    locationId,
    locationDescription,
    totalPositiveBehaviours: 100,
    totalNegativeBehaviours: 10,
    totalIncentiveEncouragements: 200,
    totalIncentiveWarnings: 20,
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
            daysOnLevel: 50,
            daysSinceLastReview: 10,
            positiveBehaviours: 100,
            incentiveEncouragements: 99,
            negativeBehaviours: 10,
            incentiveWarnings: 9,
            provenAdjudications: 1,
          },
        ],
      },
    ],
  }
}

// eslint-disable-next-line import/prefer-default-export
export { getTestIncentivesLocationSummary }
