import type { IncentivesReviewsResponse } from '../data/incentivesApi'

export default function getTestIncentivesReviews(): IncentivesReviewsResponse {
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
        isNewToPrison: false,
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
        isNewToPrison: true,
      },
    ],
  }
}
