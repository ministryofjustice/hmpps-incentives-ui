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
    totalPositiveBehaviours: 303,
    totalNegativeBehaviours: 11,
    totalIncentiveEncouragements: 278,
    totalIncentiveWarnings: 9,
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
      {
        level: 'STD',
        levelDescription: 'Standard',
        numberAtThisLevel: 2,
        prisonerBehaviours: [
          {
            prisonerNumber: 'B1234CD',
            bookingId: 222222,
            imageId: 333333,
            firstName: 'James',
            lastName: 'Dean',
            daysOnLevel: 100,
            daysSinceLastReview: 10,
            positiveBehaviours: 123,
            incentiveEncouragements: 100,
            negativeBehaviours: 1,
            incentiveWarnings: 0,
            provenAdjudications: 0,
          },
          {
            prisonerNumber: 'C1234EF',
            bookingId: 333333,
            imageId: 444444,
            firstName: 'John',
            lastName: 'Doe',
            daysOnLevel: 10,
            daysSinceLastReview: 10,
            positiveBehaviours: 80,
            incentiveEncouragements: 79,
            negativeBehaviours: 0,
            incentiveWarnings: 0,
            provenAdjudications: 0,
          },
        ],
      },
    ],
  }
}

// eslint-disable-next-line import/prefer-default-export
export { getTestIncentivesLocationSummary }
