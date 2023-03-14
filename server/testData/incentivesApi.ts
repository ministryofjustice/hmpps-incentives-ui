import type { IncentivesLocationSummary, IncentivesReviewsResponse } from '../data/incentivesApi'

export function getTestIncentivesLocationSummary({
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

export function getTestIncentivesReviews(): IncentivesReviewsResponse {
  return {
    locationDescription: 'Houseblock 1',
    overdueCount: 16,
    reviewCount: 135,
    levels: [
      {
        levelCode: 'BAS',
        levelName: 'Basic',
        reviewCount: 138,
        overdueCount: 16,
      },
      {
        levelCode: 'STD',
        levelName: 'Standard',
        reviewCount: 135,
        overdueCount: 0,
      },
      {
        levelCode: 'ENH',
        levelName: 'Enhanced',
        reviewCount: 130,
        overdueCount: 0,
      },
    ],
    reviews: [
      {
        firstName: 'John',
        lastName: 'Saunders',
        levelCode: 'STD',
        prisonerNumber: 'G6123VU',
        bookingId: 100000,
        nextReviewDate: new Date(2022, 6, 12),
        daysSinceLastReview: 37,
        positiveBehaviours: 3,
        negativeBehaviours: 2,
        hasAcctOpen: true,
      },
      {
        firstName: 'Flem',
        lastName: 'Hermosilla',
        levelCode: 'STD',
        prisonerNumber: 'G5992UH',
        bookingId: 100001,
        nextReviewDate: new Date(2023, 9, 10),
        daysSinceLastReview: null,
        positiveBehaviours: 2,
        negativeBehaviours: 0,
        hasAcctOpen: false,
      },
    ],
  }
}
