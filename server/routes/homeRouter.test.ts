import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import type { AboutPageFeedbackData } from './forms/aboutPageFeedbackForm'

let app: Express

beforeEach(() => {
  jest.clearAllMocks()

  app = appWithAllRoutes({})
})

describe('Home page', () => {
  describe(`'hideDaysColumnsInIncentivesTable' feature flag`, () => {
    describe('when on', () => {
      beforeEach(() => {
        app.locals.featureFlags.hideDaysColumnsInIncentivesTable = true
      })

      it('incentive information tile does not mention review dates', () => {
        return request(app)
          .get('/')
          .expect(res => {
            expect(res.text).toContain('Prisoner incentive information')
            expect(res.text).toContain(
              'See incentive levels and behaviour entries for the prison population, by residential location.',
            )
            expect(res.text).not.toContain('review date')
          })
      })
    })

    describe('when off', () => {
      beforeEach(() => {
        app.locals.featureFlags.hideDaysColumnsInIncentivesTable = false
      })

      it('incentive information tile mentions review dates', () => {
        return request(app)
          .get('/')
          .expect(res => {
            expect(res.text).toContain('Prisoner incentive information')
            expect(res.text).toContain(
              'See review dates, incentive levels and behaviour entries by residential location.',
            )
          })
      })
    })
  })

  it('has a tile linking to About page', () => {
    return request(app)
      .get('/')
      .expect(res => {
        expect(res.text).toContain('Information on how we collect, group and analyse data')
      })
  })
})

describe('About page', () => {
  const url = '/about'
  const formId = 'about-page-feedback'

  describe('has a feedback form', () => {
    it('which is displayed when the page is loaded', () => {
      return request(app)
        .get(url)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Please leave your feedback')
        })
    })

    const correctData: Partial<AboutPageFeedbackData>[] = [
      { informationUseful: 'yes' },
      { informationUseful: 'yes', yesComments: 'Great to know these details' },
      { informationUseful: 'no' },
      { informationUseful: 'no', noComments: 'My prison is not listed' },
    ]
    describe.each(correctData)('which allows posting feedback', formSubmission => {
      it('and shows a success message', () => {
        return request(app)
          .post(url)
          .send({ formId, ...formSubmission })
          .expect(200)
          .expect(res => {
            expect(res.text).toContain('Your feedback has been submitted')
          })
      })
    })

    const incorrectData: object[] = [
      {},
      { informationUseful: '' },
      { informationUseful: 'nope' },
      { noComments: 'It’s confusing' },
    ]
    describe.each(incorrectData)('which prevents posting invalid feedback', formSubmission => {
      it('and shows an error message', () => {
        return request(app)
          .post(url)
          .send({ formId, ...formSubmission })
          .expect(200)
          .expect(res => {
            expect(res.text).not.toContain('Your feedback has been submitted')
            expect(res.text).toContain('There is a problem') // error summary
            expect(res.text).toContain('Tell us if you found this information useful') // error message
            expect(res.text).toContain(`#${formId}-informationUseful`) // link to field
          })
      })
    })
  })
})
