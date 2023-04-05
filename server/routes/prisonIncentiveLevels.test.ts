import type { Express } from 'express'
import jquery from 'jquery'
import { JSDOM } from 'jsdom'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import createUserToken from './testutils/createUserToken'
import { sampleIncentiveLevels, samplePrisonIncentiveLevels } from '../testData/incentivesApi'
import { IncentivesApi } from '../data/incentivesApi'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/incentivesApi', () => {
  type module = typeof import('../data/incentivesApi')
  const realModule = jest.requireActual<module>('../data/incentivesApi')
  const mockedModule = jest.createMockFromModule<module>('../data/incentivesApi')
  return { __esModule: true, ...realModule, IncentivesApi: mockedModule.IncentivesApi }
})

let app: Express
let incentivesApi: jest.Mocked<IncentivesApi>

beforeEach(() => {
  app = appWithAllRoutes({})

  incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
  incentivesApi.getIncentiveLevels.mockResolvedValue(sampleIncentiveLevels)
  incentivesApi.getPrisonIncentiveLevels.mockResolvedValue(
    samplePrisonIncentiveLevels.filter(prisonIncentiveLevel => prisonIncentiveLevel.active),
  )
  incentivesApi.getIncentiveLevel.mockResolvedValue(sampleIncentiveLevels[1])
  incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[1])
})

afterEach(() => {
  incentivesApi.updatePrisonIncentiveLevel.mockClear()
})

const tokenWithMissingRole = createUserToken([])
const tokenWithNecessaryRole = createUserToken(['ROLE_MAINTAIN_PRISON_IEP_LEVELS'])

describe('Prison incentive level management', () => {
  it.each(['/prison-incentive-levels', '/prison-incentive-levels/view/STD', '/prison-incentive-levels/remove/STD'])(
    'should not be accessible without correct role: %s',
    (url: string) => {
      return request(app)
        .get(url)
        .set('authorization', `bearer ${tokenWithMissingRole}`)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/authError')
        })
    },
  )

  it.each([
    ['/prison-incentive-levels', 'prison-incentive-levels-list'],
    ['/prison-incentive-levels/view/STD', 'prison-incentive-levels-detail'],
  ])('should be accessible with necessary role: %s', (url: string, expectedPage: string) => {
    return request(app)
      .get(url)
      .set('authorization', `bearer ${tokenWithNecessaryRole}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(`data-qa="${expectedPage}"`)
      })
  })

  describe('list of levels', () => {
    it('should list all incentive levels', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/prison-incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="prison-incentive-levels-table"] tbody tr')
          const levelNames = $tableRows
            .map((_index, tr) => {
              const levelNameCell = $(tr).find('th')[0]
              return levelNameCell.textContent.trim()
            })
            .toArray()
          expect(levelNames).toEqual(['Basic', 'Standard', 'Enhanced'])
        })
    })

    it('should lable the default level for new prisoners', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/prison-incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="prison-incentive-levels-table"] tbody tr')
          const tags = $tableRows
            .map((_index, tr) => {
              const tagCell = $(tr).find('td')[0]
              return tagCell.textContent.trim()
            })
            .toArray()
          expect(tags).toHaveLength(3)
          expect(tags[0]).not.toContain('Default')
          expect(tags[1]).toContain('Default')
          expect(tags[2]).not.toContain('Default')
        })
    })

    it('should only show remove link for levels that are not required', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery
      // pretend that only BAS & STD are required
      incentivesApi.getIncentiveLevels.mockResolvedValue(
        sampleIncentiveLevels.map((incentiveLevel, index) => {
          return { ...incentiveLevel, required: index < 2 }
        }),
      )

      return request(app)
        .get('/prison-incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="prison-incentive-levels-table"] tbody tr')
          const linkTexts = $tableRows
            .map((_index, tr) => {
              const linkCell = $(tr).find('td')[1]
              return linkCell.textContent
            })
            .toArray()
          expect(linkTexts).toHaveLength(3)
          expect(linkTexts[0]).not.toContain('Remove level')
          expect(linkTexts[1]).not.toContain('Remove level')
          expect(linkTexts[2]).toContain('Remove level')
        })
    })

    it('should show add level button when there are some available levels', () => {
      return request(app)
        .get('/prison-incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          expect(res.text).toContain('Add a new incentive level')
        })
    })

    it('should show not add level button when there are no more available levels', () => {
      // pretend that only BAS, STD & ENH exist all of which are already active
      incentivesApi.getIncentiveLevels.mockResolvedValue(
        sampleIncentiveLevels.filter(incentiveLevel =>
          samplePrisonIncentiveLevels.some(
            prisonIncentiveLevel =>
              prisonIncentiveLevel.active && incentiveLevel.code === prisonIncentiveLevel.levelCode,
          ),
        ),
      )

      return request(app)
        .get('/prison-incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          expect(res.text).not.toContain('Add a new incentive level')
        })
    })
  })

  describe('details of a level', () => {
    it('should show money and visit information', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/prison-incentive-levels/view/STD')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('tbody tr')
          const values = $tableRows
            .map((_index, tr) => {
              const valueCell = $(tr).find('td')[1]
              return valueCell.textContent.trim()
            })
            .toArray()
          expect(values).toEqual([
            'Yes',
            '£60.50 per week',
            '£19.80 per week',
            '£605',
            '£198',
            '1 per 2 weeks',
            '2 per 4 weeks',
          ])
        })
    })

    it('should state when a level is not the default for new prisoners', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery
      incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[0])

      return request(app)
        .get('/prison-incentive-levels/view/BAS')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('tbody tr')
          const values = $tableRows
            .map((_index, tr) => {
              const valueCell = $(tr).find('td')[1]
              return valueCell.textContent.trim()
            })
            .toArray()
          expect(values).toEqual([
            'No',
            '£27.50 per week',
            '£5.50 per week',
            '£275',
            '£55',
            '1 per 2 weeks',
            '0 per 4 weeks',
          ])
        })
    })
  })

  describe('deactivating a level', () => {
    it('should 404 if level is required globally', () => {
      return request(app)
        .get('/prison-incentive-levels/remove/STD')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(404)
    })

    it('should 404 if level is already inactive', () => {
      incentivesApi.getIncentiveLevel.mockResolvedValue(sampleIncentiveLevels[5])
      incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[3])

      return request(app)
        .get('/prison-incentive-levels/remove/ENT')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(404)
    })

    describe('when deactivation is allowed', () => {
      beforeEach(() => {
        // pretend that ENH is not globally required
        incentivesApi.getIncentiveLevel.mockResolvedValue({ ...sampleIncentiveLevels[2], required: false })
        incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[2])
      })

      it('should show form to deactivate level', () => {
        return request(app)
          .get('/prison-incentive-levels/remove/ENH')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .expect(200)
          .expect(res => {
            expect(res.text).toContain('data-qa="prison-incentive-levels-deactivate"')
            expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
          })
      })

      it('should redirect to list of levels if deactivation is cancelled', () => {
        return request(app)
          .post('/prison-incentive-levels/remove/ENH')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .send({ formId: 'prisonIncentiveLevelDeactivateForm', confirmation: 'no' })
          .expect(res => {
            expect(res.redirect).toBeTruthy()
            expect(res.headers.location).toBe('/prison-incentive-levels')
            expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
          })
      })

      it('should show an error if confirmation not provided', () => {
        return request(app)
          .post('/prison-incentive-levels/remove/ENH')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .send({ formId: 'prisonIncentiveLevelDeactivateForm' })
          .expect(res => {
            expect(res.text).toContain('Please select yes or no')
            expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
          })
      })

      it('should deactivate level if confirmed', () => {
        incentivesApi.updatePrisonIncentiveLevel.mockResolvedValue({
          ...samplePrisonIncentiveLevels[2],
          active: false,
        })

        return request(app)
          .post('/prison-incentive-levels/remove/ENH')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .send({ formId: 'prisonIncentiveLevelDeactivateForm', confirmation: 'yes' })
          .expect(res => {
            expect(res.redirect).toBeTruthy()
            expect(res.headers.location).toBe('/prison-incentive-levels')
            expect(incentivesApi.updatePrisonIncentiveLevel).toHaveBeenCalledWith('MDI', 'ENH', { active: false })
          })
      })
    })
  })

  describe('editing a level', () => {
    it('should 404 if level is inactive', () => {
      incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[3])

      return request(app)
        .get('/prison-incentive-levels/edit/ENT')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(404)
    })

    describe('when editing is allowed', () => {
      it('should show form to edit existing level', () => {
        return request(app)
          .get('/prison-incentive-levels/edit/STD')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .expect(200)
          .expect(res => {
            expect(res.text).toContain('data-qa="prison-incentive-levels-edit"')
            expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
          })
      })

      it('should show form prefilled with default level details', () => {
        const $ = jquery(new JSDOM().window) as unknown as typeof jquery

        return request(app)
          .get('/prison-incentive-levels/edit/STD')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .expect(res => {
            const $body = $(res.text)

            const title = $body.find('h1').text()
            expect(title).toContain('Change settings for Standard')

            const errorSummary = $body.find('.govuk-error-summary')
            expect(errorSummary.length).toEqual(0)

            const defaultForAdmissionChecked = $body.find('input.govuk-checkboxes__input').is(':checked')
            expect(defaultForAdmissionChecked).toBeTruthy()

            const fieldValues = $body
              .find('input.govuk-input')
              .map((_index, input: HTMLInputElement) => input.value.trim())
              .toArray()
            expect(fieldValues).toEqual(['60.50', '19.80', '605.00', '198.00', '1', '2'])
          })
      })

      it('should show form prefilled with non-default level details', () => {
        const $ = jquery(new JSDOM().window) as unknown as typeof jquery
        incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[0])

        return request(app)
          .get('/prison-incentive-levels/edit/BAS')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .expect(res => {
            const $body = $(res.text)

            const title = $body.find('h1').text()
            expect(title).toContain('Change settings for Basic')

            const errorSummary = $body.find('.govuk-error-summary')
            expect(errorSummary.length).toEqual(0)

            const defaultForAdmissionChecked = $body.find('input.govuk-checkboxes__input').is(':checked')
            expect(defaultForAdmissionChecked).toBeFalsy()

            const fieldValues = $body
              .find('input.govuk-input')
              .map((_index, input: HTMLInputElement) => input.value.trim())
              .toArray()
            expect(fieldValues).toEqual(['27.50', '5.50', '275.00', '55.00', '1', '0'])
          })
      })

      it.each([
        ['empty form', {}, 'There is a problem'],
        [
          'mistyped amount',
          {
            defaultOnAdmission: 'yes',

            remandTransferLimit: '60.5',
            remandSpendLimit: '605',
            convictedTransferLimit: '19.80',
            convictedSpendLimit: '198',

            visitOrders: '1',
            privilegedVisitOrders: '1',
          },
          'Remand transfer limit must be in pounds and pence',
        ],
        [
          'empty number field',
          {
            defaultOnAdmission: 'yes',

            remandTransferLimit: '60.50',
            remandSpendLimit: '605',
            convictedTransferLimit: '19.80',
            convictedSpendLimit: '198',

            visitOrders: '',
            privilegedVisitOrders: '1',
          },
          'Visits per 2 weeks must be a number',
        ],
      ])('should show errors for mistakes in form: %s', (_scenario, form, errorMessage) => {
        const $ = jquery(new JSDOM().window) as unknown as typeof jquery

        return request(app)
          .post('/prison-incentive-levels/edit/STD')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .send({ formId: 'prisonIncentiveLevelEditForm', ...form })
          .expect(res => {
            const $body = $(res.text)

            const errorSummary = $body.find('.govuk-error-summary')
            expect(errorSummary.length).toEqual(1)
            expect(errorSummary.text()).toContain(errorMessage)

            expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
          })
      })

      it.each([
        [
          'checking default',
          {
            defaultOnAdmission: 'yes',

            remandTransferLimit: '60.50',
            remandSpendLimit: '605',
            convictedTransferLimit: '19.80',
            convictedSpendLimit: '198',

            visitOrders: '1',
            privilegedVisitOrders: '1',
          },
          {
            defaultOnAdmission: true,

            remandTransferLimitInPence: 60_50,
            remandSpendLimitInPence: 605_00,
            convictedTransferLimitInPence: 19_80,
            convictedSpendLimitInPence: 198_00,

            visitOrders: 1,
            privilegedVisitOrders: 1,
          },
        ],
        [
          'unchecking default',
          {
            remandTransferLimit: '60.50',
            remandSpendLimit: '605.00',
            convictedTransferLimit: '19.80',
            convictedSpendLimit: '198.00',

            visitOrders: '1',
            privilegedVisitOrders: '2',
          },
          {
            defaultOnAdmission: false,

            remandTransferLimitInPence: 60_50,
            remandSpendLimitInPence: 605_00,
            convictedTransferLimitInPence: 19_80,
            convictedSpendLimitInPence: 198_00,

            visitOrders: 1,
            privilegedVisitOrders: 2,
          },
        ],
      ])('should save changes if there were no mistakes: %s', (_scenario, form, expectedUpdate) => {
        incentivesApi.updatePrisonIncentiveLevel.mockResolvedValue({
          ...samplePrisonIncentiveLevels[1],
          ...expectedUpdate,
        })

        return request(app)
          .post('/prison-incentive-levels/edit/STD')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .send({ formId: 'prisonIncentiveLevelEditForm', ...form })
          .expect(res => {
            expect(res.redirect).toBeTruthy()
            expect(res.headers.location).toBe('/prison-incentive-levels/view/STD')

            expect(incentivesApi.updatePrisonIncentiveLevel).toHaveBeenCalledWith('MDI', 'STD', expectedUpdate)
          })
      })
    })
  })
})
