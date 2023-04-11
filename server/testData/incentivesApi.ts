import type { IncentivesReviewsResponse, IncentiveLevel, PrisonIncentiveLevel } from '../data/incentivesApi'

export const sampleIncentiveLevels: IncentiveLevel[] = [
  { code: 'BAS', name: 'Basic', description: '', active: true, required: true },
  { code: 'STD', name: 'Standard', description: '', active: true, required: true },
  { code: 'ENH', name: 'Enhanced', description: '', active: true, required: true },
  { code: 'EN2', name: 'Enhanced 2', description: '', active: true, required: false },
  { code: 'EN3', name: 'Enhanced 3', description: '', active: true, required: false },
  { code: 'ENT', name: 'Entry', description: '', active: false, required: false },
]

export const samplePrisonIncentiveLevels: PrisonIncentiveLevel[] = [
  {
    prisonId: 'MDI',
    levelCode: 'BAS',
    levelName: 'Basic',
    active: true,
    defaultOnAdmission: false,

    remandTransferLimitInPence: 27_50,
    remandSpendLimitInPence: 275_00,
    convictedTransferLimitInPence: 5_50,
    convictedSpendLimitInPence: 55_00,

    visitOrders: 1,
    privilegedVisitOrders: 0,
  },
  {
    prisonId: 'MDI',
    levelCode: 'STD',
    levelName: 'Standard',
    active: true,
    defaultOnAdmission: true,

    remandTransferLimitInPence: 60_50,
    remandSpendLimitInPence: 605_00,
    convictedTransferLimitInPence: 19_80,
    convictedSpendLimitInPence: 198_00,

    visitOrders: 1,
    privilegedVisitOrders: 2,
  },
  {
    prisonId: 'MDI',
    levelCode: 'ENH',
    levelName: 'Enhanced',
    active: true,
    defaultOnAdmission: false,

    remandTransferLimitInPence: 66_00,
    remandSpendLimitInPence: 660_00,
    convictedTransferLimitInPence: 44_00,
    convictedSpendLimitInPence: 440_00,

    visitOrders: 1,
    privilegedVisitOrders: 3,
  },
  {
    prisonId: 'MDI',
    levelCode: 'ENT',
    levelName: 'Entry',
    active: false,
    defaultOnAdmission: false,

    remandTransferLimitInPence: 33_50,
    remandSpendLimitInPence: 335_00,
    convictedTransferLimitInPence: 12_60,
    convictedSpendLimitInPence: 126_00,

    visitOrders: 1,
    privilegedVisitOrders: 1,
  },
]

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
