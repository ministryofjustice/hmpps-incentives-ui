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
  stubGetReviews: (): SuperAgentRequest => {
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
              levelCode: 'BAS',
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
              levelCode: 'BAS',
              prisonerNumber: 'G5992UH',
              bookingId: 100001,
              nextReviewDate: new Date(2023, 9, 10),
              daysSinceLastReview: null,
              positiveBehaviours: 2,
              negativeBehaviours: 0,
              hasAcctOpen: false,
              isNewToPrison: true,
            },
            {
              firstName: 'Jones',
              lastName: 'Tom',
              levelCode: 'STA',
              prisonerNumber: 'G5999UH',
              bookingId: 100001,
              nextReviewDate: new Date(2023, 9, 10),
              daysSinceLastReview: null,
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
              levelCode: 'BAS',
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
              levelCode: 'BAS',
              prisonerNumber: 'G5992UH',
              bookingId: 100001,
              nextReviewDate: new Date(2023, 9, 10),
              daysSinceLastReview: null,
              positiveBehaviours: 2,
              negativeBehaviours: 0,
              hasAcctOpen: false,
              isNewToPrison: true,
            },
            {
              firstName: 'Jones',
              lastName: 'Tom',
              levelCode: 'STA',
              prisonerNumber: 'G5999UH',
              bookingId: 100001,
              nextReviewDate: new Date(2023, 9, 10),
              daysSinceLastReview: null,
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
              firstName: 'Flem',
              lastName: 'Hermosilla',
              levelCode: 'BAS',
              prisonerNumber: 'G5992UH',
              bookingId: 100001,
              nextReviewDate: new Date(2023, 9, 10),
              daysSinceLastReview: 82,
              positiveBehaviours: 2,
              negativeBehaviours: 0,
              hasAcctOpen: false,
              isNewToPrison: true,
            },
            {
              firstName: 'John',
              lastName: 'Saunders',
              levelCode: 'BAS',
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
              firstName: 'Jones',
              lastName: 'Tom',
              levelCode: 'STA',
              prisonerNumber: 'G5999UH',
              bookingId: 100001,
              nextReviewDate: new Date(2023, 9, 10),
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
