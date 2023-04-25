import { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'
import type { IncentiveLevel, PrisonIncentiveLevel } from '../../server/data/incentivesApi'
import { sampleIncentiveLevels, samplePrisonIncentiveLevels } from '../../server/testData/incentivesApi'

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

  stubIncentiveLevels: (
    options: { inactive: boolean } | { incentiveLevels: IncentiveLevel[] } = {
      inactive: false,
    },
  ): SuperAgentRequest => {
    let urlPattern = '/incentivesApi/incentive/levels'
    let incentiveLevels: IncentiveLevel[]
    if ('incentiveLevels' in options) {
      incentiveLevels = options.incentiveLevels
    } else {
      if (options.inactive) {
        urlPattern += '\\?with-inactive=true'
      }
      incentiveLevels = options.inactive
        ? sampleIncentiveLevels
        : sampleIncentiveLevels.filter(incentiveLevel => incentiveLevel.active)
    }

    return stubFor({
      request: {
        method: 'GET',
        urlPattern,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: incentiveLevels,
      },
    })
  },

  stubIncentiveLevel: (
    options: { incentiveLevel: IncentiveLevel } = { incentiveLevel: sampleIncentiveLevels[1] },
  ): SuperAgentRequest => {
    const { incentiveLevel } = options

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/incentivesApi/incentive/levels/${incentiveLevel.code}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: incentiveLevel,
      },
    })
  },

  stubPrisonIncentiveLevels: (
    options: { prisonId: string } & ({ inactive: boolean } | { prisonIncentiveLevels: PrisonIncentiveLevel[] }) = {
      prisonId: 'MDI',
      inactive: false,
    },
  ): SuperAgentRequest => {
    let prisonIncentiveLevels: PrisonIncentiveLevel[]
    if ('prisonIncentiveLevels' in options) {
      prisonIncentiveLevels = options.prisonIncentiveLevels
    } else {
      prisonIncentiveLevels = options.inactive
        ? samplePrisonIncentiveLevels
        : samplePrisonIncentiveLevels.filter(incentiveLevel => incentiveLevel.active)
    }

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/incentivesApi/incentive/prison-levels/${options.prisonId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisonIncentiveLevels,
      },
    })
  },

  stubPrisonIncentiveLevel: (
    options: { prisonIncentiveLevel: PrisonIncentiveLevel } = { prisonIncentiveLevel: samplePrisonIncentiveLevels[1] },
  ): SuperAgentRequest => {
    const { prisonIncentiveLevel } = options

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/incentivesApi/incentive/prison-levels/${prisonIncentiveLevel.prisonId}/level/${prisonIncentiveLevel.levelCode}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisonIncentiveLevel,
      },
    })
  },

  stubPatchPrisonIncentiveLevel: (options: { prisonIncentiveLevel: PrisonIncentiveLevel }): SuperAgentRequest => {
    const { prisonIncentiveLevel } = options

    return stubFor({
      request: {
        method: 'PATCH',
        urlPattern: `/incentivesApi/incentive/prison-levels/${prisonIncentiveLevel.prisonId}/level/${prisonIncentiveLevel.levelCode}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: prisonIncentiveLevel,
      },
    })
  },

  /**
   * @deprecated use stubIncentiveLevels once api switches over
   */
  stubGetAvailableLevels: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/incentivesApi/iep/levels/MDI',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            iepLevel: 'BAS',
            iepDescription: 'Basic',
            sequence: 1,
            default: false,
          },
          {
            iepLevel: 'STD',
            iepDescription: 'Standard',
            sequence: 2,
            default: true,
          },
          {
            iepLevel: 'ENH',
            iepDescription: 'Enhanced',
            sequence: 3,
            default: false,
          },
        ],
      },
    })
  },

  stubGetIncentivesLevelBasic: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern:
          '/incentivesApi/incentives-reviews/prison/MDI/location/MDI-42/level/BAS\\?sort=NEXT_REVIEW_DATE&order=ASC&page=0&pageSize=20',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          locationDescription: 'Houseblock 42',
          overdueCount: 1,
          reviewCount: 1,
          levels: [
            {
              levelCode: 'BAS',
              levelName: 'Basic',
              reviewCount: 1,
              overdueCount: 1,
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
              reviewCount: 0,
              overdueCount: 0,
            },
          ],
          reviews: [
            {
              firstName: 'John',
              lastName: 'Saunders',
              levelCode: 'BAS',
              prisonerNumber: 'G6123VU',
              bookingId: 100000,
              nextReviewDate: '2022-06-12',
              daysSinceLastReview: 37,
              positiveBehaviours: 3,
              negativeBehaviours: 2,
              hasAcctOpen: true,
              isNewToPrison: false,
            },
          ],
        },
      },
    })
  },

  stubGetIncentivesLevelStandard: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern:
          '/incentivesApi/incentives-reviews/prison/MDI/location/MDI-42/level/STD\\?sort=NEXT_REVIEW_DATE&order=ASC&page=0&pageSize=20',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          locationDescription: 'Houseblock 42',
          overdueCount: 1,
          reviewCount: 1,
          levels: [
            {
              levelCode: 'BAS',
              levelName: 'Basic',
              reviewCount: 2,
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
              reviewCount: 0,
              overdueCount: 0,
            },
          ],
          reviews: [
            {
              firstName: 'Flem',
              lastName: 'Hermosilla',
              levelCode: 'STD',
              prisonerNumber: 'G5992UH',
              bookingId: 100001,
              nextReviewDate: '2023-09-10',
              daysSinceLastReview: null,
              positiveBehaviours: 2,
              negativeBehaviours: 0,
              hasAcctOpen: false,
              isNewToPrison: true,
            },
          ],
        },
      },
    })
  },

  stubGetIncentivesSorted: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern:
          '/incentivesApi/incentives-reviews/prison/MDI/location/MDI-42/level/BAS\\?sort=DAYS_SINCE_LAST_REVIEW&order=ASC&page=0&pageSize=20',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          locationDescription: 'Houseblock 42',
          overdueCount: 2,
          reviewCount: 2,
          levels: [
            {
              levelCode: 'BAS',
              levelName: 'Basic',
              reviewCount: 2,
              overdueCount: 1,
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
              reviewCount: 0,
              overdueCount: 0,
            },
          ],
          reviews: [
            {
              firstName: 'John',
              lastName: 'Saunders',
              levelCode: 'BAS',
              prisonerNumber: 'G6123VU',
              bookingId: 100000,
              nextReviewDate: '2022-06-12',
              daysSinceLastReview: 37,
              positiveBehaviours: 3,
              negativeBehaviours: 2,
              hasAcctOpen: true,
              isNewToPrison: false,
            },
            {
              firstName: 'Jones',
              lastName: 'Tom',
              levelCode: 'BAS',
              prisonerNumber: 'G5999UH',
              bookingId: 100001,
              nextReviewDate: '2023-09-10',
              daysSinceLastReview: 1,
              positiveBehaviours: 0,
              negativeBehaviours: 0,
              hasAcctOpen: false,
              isNewToPrison: true,
            },
          ],
        },
      },
    })
  },
}
