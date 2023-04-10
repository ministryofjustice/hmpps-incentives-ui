import type { Express } from 'express'
import jquery from 'jquery'
import { JSDOM } from 'jsdom'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import createUserToken from './testutils/createUserToken'
import { sampleIncentiveLevels, samplePrisonIncentiveLevels } from '../testData/incentivesApi'
import { IncentivesApi } from '../data/incentivesApi'
import type { PrisonIncentiveLevelAddData } from './forms/prisonIncentiveLevelAddForm'
import type { PrisonIncentiveLevelDeactivateData } from './forms/prisonIncentiveLevelDeactivateForm'
import type { PrisonIncentiveLevelEditData } from './forms/prisonIncentiveLevelEditForm'

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
    it('should indicate bad request if level is required globally', () => {
      return request(app)
        .get('/prison-incentive-levels/remove/STD')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(400)
        .expect(() => {
          expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should indicate bad request if level is required globally (POST)', () => {
      const validForm: PrisonIncentiveLevelDeactivateData = {
        formId: 'prisonIncentiveLevelDeactivateForm',
        confirmation: 'yes',
      }

      return request(app)
        .post('/prison-incentive-levels/remove/STD')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .expect(400)
        .expect(() => {
          expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should indicate bad request if level is already inactive', () => {
      incentivesApi.getIncentiveLevel.mockResolvedValue(sampleIncentiveLevels[5])
      incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[3])

      return request(app)
        .get('/prison-incentive-levels/remove/ENT')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(400)
        .expect(() => {
          expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should indicate bad request if level is already inactive (POST)', () => {
      incentivesApi.getIncentiveLevel.mockResolvedValue(sampleIncentiveLevels[5])
      incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[3])

      const validForm: PrisonIncentiveLevelDeactivateData = {
        formId: 'prisonIncentiveLevelDeactivateForm',
        confirmation: 'yes',
      }

      return request(app)
        .post('/prison-incentive-levels/remove/ENT')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .expect(400)
        .expect(() => {
          expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should indicate bad request if level is default for admissions', () => {
      incentivesApi.getIncentiveLevel.mockResolvedValue({ ...sampleIncentiveLevels[1], required: false })
      incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[1])

      return request(app)
        .get('/prison-incentive-levels/remove/STD')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(400)
        .expect(() => {
          expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should indicate bad request if level is default for admissions (POST)', () => {
      incentivesApi.getIncentiveLevel.mockResolvedValue({ ...sampleIncentiveLevels[1], required: false })
      incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[1])

      const validForm: PrisonIncentiveLevelDeactivateData = {
        formId: 'prisonIncentiveLevelDeactivateForm',
        confirmation: 'yes',
      }

      return request(app)
        .post('/prison-incentive-levels/remove/STD')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .expect(400)
        .expect(() => {
          expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
        })
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

      it('should show error message returned by api', () => {
        incentivesApi.updatePrisonIncentiveLevel.mockRejectedValue({
          status: 400,
          userMessage: 'Validation failure: A level must be active if it is required',
          developerMessage: 'A level must be active if it is required',
        })

        return request(app)
          .post('/prison-incentive-levels/remove/EN2')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .send({ formId: 'prisonIncentiveLevelDeactivateForm', confirmation: 'yes' })
          .redirects(1)
          .expect(res => {
            expect(res.text).toContain('Incentive level was not removed!')
            expect(res.text).toContain('A level must be active if it is required')

            expect(incentivesApi.updatePrisonIncentiveLevel).toHaveBeenCalled()
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
        .expect(() => {
          expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should 404 if level is inactive (POST)', () => {
      incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[3])

      const validForm: PrisonIncentiveLevelEditData = {
        formId: 'prisonIncentiveLevelEditForm',

        defaultOnAdmission: 'yes',

        remandTransferLimit: '60.50',
        remandSpendLimit: '605',
        convictedTransferLimit: '19.80',
        convictedSpendLimit: '198',

        visitOrders: '1',
        privilegedVisitOrders: '1',
      }

      return request(app)
        .post('/prison-incentive-levels/edit/ENT')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .expect(404)
        .expect(() => {
          expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
        })
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
        [
          'level must remain the default',
          {
            remandTransferLimit: '60.50',
            remandSpendLimit: '605',
            convictedTransferLimit: '19.80',
            convictedSpendLimit: '198',

            visitOrders: '1',
            privilegedVisitOrders: '1',
          },
          'There must be a default level for new prisoners',
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

      it('should show error message returned by api', () => {
        incentivesApi.updatePrisonIncentiveLevel.mockRejectedValue({
          status: 400,
          userMessage: 'Validation failure: There must be an active default level for admission in a prison',
          developerMessage: 'There must be an active default level for admission in a prison',
        })

        const validForm: PrisonIncentiveLevelEditData = {
          formId: 'prisonIncentiveLevelEditForm',

          defaultOnAdmission: 'yes',

          remandTransferLimit: '60.50',
          remandSpendLimit: '605',
          convictedTransferLimit: '19.80',
          convictedSpendLimit: '198',

          visitOrders: '1',
          privilegedVisitOrders: '1',
        }

        return request(app)
          .post('/prison-incentive-levels/edit/STD')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .send(validForm)
          .redirects(1)
          .expect(res => {
            expect(res.text).toContain('Incentive level settings were not saved!')
            expect(res.text).toContain('There must be an active default level for admission in a prison')

            expect(incentivesApi.updatePrisonIncentiveLevel).toHaveBeenCalled()
          })
      })

      it.each([
        [
          'leaving level as default',
          'STD',
          1,
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
          'leaving level as non-default',
          'BAS',
          0,
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
        [
          'making level newly the default',
          'ENH',
          2,
          {
            defaultOnAdmission: 'yes',

            remandTransferLimit: '60.50',
            remandSpendLimit: '605.00',
            convictedTransferLimit: '19.80',
            convictedSpendLimit: '198.00',

            visitOrders: '1',
            privilegedVisitOrders: '2',
          },
          {
            defaultOnAdmission: true,

            remandTransferLimitInPence: 60_50,
            remandSpendLimitInPence: 605_00,
            convictedTransferLimitInPence: 19_80,
            convictedSpendLimitInPence: 198_00,

            visitOrders: 1,
            privilegedVisitOrders: 2,
          },
        ],
      ])(
        'should save changes if there were no mistakes: %s',
        (_scenario, levelCode, sampleIndex, form, expectedUpdate) => {
          const prisonIncentiveLevelBeforeEdits = samplePrisonIncentiveLevels[sampleIndex]
          incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(prisonIncentiveLevelBeforeEdits)
          incentivesApi.updatePrisonIncentiveLevel.mockResolvedValue({
            ...prisonIncentiveLevelBeforeEdits,
            ...expectedUpdate,
            levelCode,
          })

          return request(app)
            .post(`/prison-incentive-levels/edit/${levelCode}`)
            .set('authorization', `bearer ${tokenWithNecessaryRole}`)
            .send({ formId: 'prisonIncentiveLevelEditForm', ...form })
            .expect(res => {
              expect(res.redirect).toBeTruthy()
              expect(res.headers.location).toBe(`/prison-incentive-levels/view/${levelCode}`)

              expect(incentivesApi.updatePrisonIncentiveLevel).toHaveBeenCalledWith('MDI', levelCode, expectedUpdate)
            })
        },
      )
    })
  })

  describe('adding a level', () => {
    beforeEach(() => {
      incentivesApi.getIncentiveLevels.mockResolvedValue(
        sampleIncentiveLevels.filter(incentiveLevel => incentiveLevel.active),
      )
    })

    it('should 404 if there is no level available', () => {
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
        .get('/prison-incentive-levels/add')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(404)
        .expect(() => {
          expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should 404 if there is no level available (POST)', () => {
      // pretend that only BAS, STD & ENH exist all of which are already active
      incentivesApi.getIncentiveLevels.mockResolvedValue(
        sampleIncentiveLevels.filter(incentiveLevel =>
          samplePrisonIncentiveLevels.some(
            prisonIncentiveLevel =>
              prisonIncentiveLevel.active && incentiveLevel.code === prisonIncentiveLevel.levelCode,
          ),
        ),
      )

      const validForm: PrisonIncentiveLevelAddData = {
        formId: 'prisonIncentiveLevelAddForm',

        levelCode: 'STD',
        defaultOnAdmission: 'yes',

        remandTransferLimit: '60.50',
        remandSpendLimit: '605',
        convictedTransferLimit: '19.80',
        convictedSpendLimit: '198',

        visitOrders: '1',
        privilegedVisitOrders: '1',
      }

      return request(app)
        .post('/prison-incentive-levels/add')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .expect(404)
        .expect(() => {
          expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    describe('when adding is allowed', () => {
      it('should show form to add a level', () => {
        return request(app)
          .get('/prison-incentive-levels/add')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .expect(200)
          .expect(res => {
            expect(res.text).toContain('data-qa="prison-incentive-levels-add"')
            expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
          })
      })

      it('should show available levels', () => {
        const $ = jquery(new JSDOM().window) as unknown as typeof jquery

        return request(app)
          .get('/prison-incentive-levels/add')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .expect(200)
          .expect(res => {
            const $body = $(res.text)

            const errorSummary = $body.find('.govuk-error-summary')
            expect(errorSummary.length).toEqual(0)

            const defaultForAdmissionChecked = $body.find('input.govuk-checkboxes__input').is(':checked')
            expect(defaultForAdmissionChecked).toBeFalsy()

            const levelCodes = $body
              .find('input.govuk-radios__input')
              .map((_index, input: HTMLInputElement) => input.value.trim())
              .toArray()
            expect(levelCodes).toEqual(['EN2', 'EN3'])
            const levelNames = $body
              .find('label.govuk-radios__label')
              .map((_index, input: HTMLLabelElement) => input.textContent.trim())
              .toArray()
            expect(levelNames).toEqual(['Enhanced 2', 'Enhanced 3'])
          })
      })

      it.each([
        ['empty form', {}, 'There is a problem'],
        [
          'level not chosen',
          {
            defaultOnAdmission: 'yes',

            remandTransferLimit: '60.50',
            remandSpendLimit: '605.00',
            convictedTransferLimit: '19.80',
            convictedSpendLimit: '198',

            visitOrders: '1',
            privilegedVisitOrders: '1',
          },
          'Please select a level to add',
        ],
        [
          'unavailable level chosen',
          {
            levelCode: 'en2',
            defaultOnAdmission: 'yes',

            remandTransferLimit: '60.50',
            remandSpendLimit: '605.00',
            convictedTransferLimit: '19.80',
            convictedSpendLimit: '198',

            visitOrders: '1',
            privilegedVisitOrders: '1',
          },
          'Please select a level to add',
        ],
        [
          'mistyped amount',
          {
            levelCode: 'EN2',
            defaultOnAdmission: 'yes',

            remandTransferLimit: '60.50',
            remandSpendLimit: '605.',
            convictedTransferLimit: '19.80',
            convictedSpendLimit: '198',

            visitOrders: '1',
            privilegedVisitOrders: '1',
          },
          'Remand spend limit must be in pounds and pence',
        ],
        [
          'mistyped number',
          {
            levelCode: 'EN2',
            defaultOnAdmission: 'yes',

            remandTransferLimit: '60.50',
            remandSpendLimit: '605.00',
            convictedTransferLimit: '19.80',
            convictedSpendLimit: '198',

            visitOrders: '1',
            privilegedVisitOrders: 'one',
          },
          'Privileged visits per 4 weeks must be a number',
        ],
      ])('should show errors for mistakes in form: %s', (_scenario, form, errorMessage) => {
        const $ = jquery(new JSDOM().window) as unknown as typeof jquery

        return request(app)
          .post('/prison-incentive-levels/add')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .send({ formId: 'prisonIncentiveLevelAddForm', ...form })
          .expect(res => {
            const $body = $(res.text)

            const errorSummary = $body.find('.govuk-error-summary')
            expect(errorSummary.length).toEqual(1)
            expect(errorSummary.text()).toContain(errorMessage)

            expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
          })
      })

      it('should show error message if first level added is not made the default for admission', () => {
        const $ = jquery(new JSDOM().window) as unknown as typeof jquery
        incentivesApi.getPrisonIncentiveLevels.mockResolvedValue([])

        const validForm: PrisonIncentiveLevelAddData = {
          formId: 'prisonIncentiveLevelAddForm',

          levelCode: 'EN2',

          remandTransferLimit: '66',
          remandSpendLimit: '660',
          convictedTransferLimit: '44',
          convictedSpendLimit: '440',

          visitOrders: '1',
          privilegedVisitOrders: '3',
        }

        return request(app)
          .post('/prison-incentive-levels/add')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .send(validForm)
          .expect(res => {
            const $body = $(res.text)

            const errorSummary = $body.find('.govuk-error-summary')
            expect(errorSummary.length).toEqual(1)
            expect(errorSummary.text()).toContain('The first level added must be the default level for new prisoners')

            expect(incentivesApi.updatePrisonIncentiveLevel).not.toHaveBeenCalled()
          })
      })

      it('should show error message returned by api', () => {
        incentivesApi.updatePrisonIncentiveLevel.mockRejectedValue({
          status: 400,
          userMessage: 'Validation failure: There must be an active default level for admission in a prison',
          developerMessage: 'There must be an active default level for admission in a prison',
        })

        const validForm: PrisonIncentiveLevelAddData = {
          formId: 'prisonIncentiveLevelAddForm',

          levelCode: 'EN2',

          remandTransferLimit: '66',
          remandSpendLimit: '660',
          convictedTransferLimit: '44',
          convictedSpendLimit: '440',

          visitOrders: '1',
          privilegedVisitOrders: '3',
        }

        return request(app)
          .post('/prison-incentive-levels/add')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .send(validForm)
          .redirects(1)
          .expect(res => {
            expect(res.text).toContain('Incentive level was not added!')
            expect(res.text).toContain('There must be an active default level for admission in a prison')

            expect(incentivesApi.updatePrisonIncentiveLevel).toHaveBeenCalled()
          })
      })

      it.each([
        [
          'checking default',
          {
            levelCode: 'EN2',
            defaultOnAdmission: 'yes',

            remandTransferLimit: '66',
            remandSpendLimit: '660',
            convictedTransferLimit: '44',
            convictedSpendLimit: '440',

            visitOrders: '1',
            privilegedVisitOrders: '3',
          },
          {
            active: true,
            defaultOnAdmission: true,

            remandTransferLimitInPence: 66_00,
            remandSpendLimitInPence: 660_00,
            convictedTransferLimitInPence: 44_00,
            convictedSpendLimitInPence: 440_00,

            visitOrders: 1,
            privilegedVisitOrders: 3,
          },
        ],
        [
          'not checking default',
          {
            levelCode: 'EN2',

            remandTransferLimit: '66',
            remandSpendLimit: '660',
            convictedTransferLimit: '44',
            convictedSpendLimit: '440',

            visitOrders: '1',
            privilegedVisitOrders: '3',
          },
          {
            active: true,
            defaultOnAdmission: false,

            remandTransferLimitInPence: 66_00,
            remandSpendLimitInPence: 660_00,
            convictedTransferLimitInPence: 44_00,
            convictedSpendLimitInPence: 440_00,

            visitOrders: 1,
            privilegedVisitOrders: 3,
          },
        ],
      ])('should save changes if there were no mistakes: %s', (_scenario, form, expectedUpdate) => {
        incentivesApi.updatePrisonIncentiveLevel.mockResolvedValue({
          ...samplePrisonIncentiveLevels[2],
          ...expectedUpdate,
          levelCode: 'EN2',
        })

        return request(app)
          .post('/prison-incentive-levels/add')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .send({ formId: 'prisonIncentiveLevelAddForm', ...form })
          .expect(res => {
            expect(res.redirect).toBeTruthy()
            expect(res.headers.location).toBe('/prison-incentive-levels/view/EN2')

            expect(incentivesApi.updatePrisonIncentiveLevel).toHaveBeenCalledWith('MDI', 'EN2', expectedUpdate)
          })
      })
    })
  })
})
