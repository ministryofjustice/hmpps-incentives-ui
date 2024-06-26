import type {
  IncentivesReviewsResponse,
  IncentiveReviewHistory,
  IncentiveLevel,
  PrisonIncentiveLevel,
} from '../data/incentivesApi'
import { convertIncentiveReviewHistoryDates } from '../data/incentivesApiUtils'

export const sampleIncentiveLevels: IncentiveLevel[] = [
  { code: 'BAS', name: 'Basic', active: true, required: true },
  { code: 'STD', name: 'Standard', active: true, required: true },
  { code: 'ENH', name: 'Enhanced', active: true, required: true },
  { code: 'EN2', name: 'Enhanced 2', active: true, required: false },
  { code: 'EN3', name: 'Enhanced 3', active: true, required: false },
  { code: 'ENT', name: 'Entry', active: false, required: false },
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

export const sampleReviewHistory: IncentiveReviewHistory = convertIncentiveReviewHistoryDates({
  prisonerNumber: 'A8083DY',
  bookingId: 12345,
  iepDate: '2017-08-15',
  iepTime: '2017-08-15T16:04:35',
  iepLevel: 'Standard',
  iepCode: 'STD',
  daysSinceReview: 1868,
  nextReviewDate: '2018-08-15',
  iepDetails: [
    {
      prisonerNumber: 'A8083DY',
      bookingId: 12345,
      iepDate: '2017-08-15',
      iepTime: '2017-08-15T16:04:35',
      agencyId: 'MDI',
      iepLevel: 'Standard',
      iepCode: 'STD',
      userId: 'NOMIS_USER',
      comments: 'STANDARD_NOMIS_USER_COMMENT',
    },
    {
      prisonerNumber: 'A8083DY',
      bookingId: 12345,
      iepDate: '2017-08-10',
      iepTime: '2017-08-10T16:04:35',
      agencyId: 'LEI',
      iepLevel: 'Basic',
      iepCode: 'BAS',
      userId: 'SYSTEM_USER',
      comments: 'BASIC_SYSTEM_USER_COMMENT',
    },
    {
      prisonerNumber: 'A8083DY',
      bookingId: 12345,
      iepDate: '2017-08-07',
      iepTime: '2017-08-07T16:04:35',
      agencyId: 'MDI',
      iepLevel: 'Enhanced',
      iepCode: 'ENH',
      userId: 'UNKNOWN_USER',
      comments: 'ENHANCED_UNKNOWN_USER_COMMENT',
    },
  ],
})

export const emptyIncentiveSummaryForBooking: IncentiveReviewHistory = convertIncentiveReviewHistoryDates({
  prisonerNumber: 'A8083DY',
  bookingId: 12345,
  iepDate: '2017-08-15',
  iepTime: '2017-08-15T16:04:35',
  iepLevel: 'Standard',
  iepCode: 'STD',
  daysSinceReview: 1868,
  nextReviewDate: '2018-08-15',
  iepDetails: [],
})

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
