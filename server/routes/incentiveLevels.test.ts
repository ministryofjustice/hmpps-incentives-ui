import type { Express } from 'express'
import jquery from 'jquery'
import { JSDOM } from 'jsdom'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import createUserToken from './testutils/createUserToken'
import { sampleIncentiveLevels } from '../testData/incentivesApi'
import { sampleAgencies } from '../testData/prisonApi'
import { IncentivesApi, type ErrorResponse, type IncentiveLevel } from '../data/incentivesApi'
import { PrisonApi } from '../data/prisonApi'
import type { SanitisedError } from '../sanitisedError'
import type { IncentiveLevelCreateData } from './forms/incentiveLevelCreateForm'
import type { IncentiveLevelEditData } from './forms/incentiveLevelEditForm'
import type { IncentiveLevelReorderData } from './forms/incentiveLevelReorderForm'
import type { IncentiveLevelStatusData } from './forms/incentiveLevelStatusForm'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/incentivesApi', () => {
  type module = typeof import('../data/incentivesApi')
  const realModule = jest.requireActual<module>('../data/incentivesApi')
  const mockedModule = jest.createMockFromModule<module>('../data/incentivesApi')
  return { __esModule: true, ...realModule, IncentivesApi: mockedModule.IncentivesApi }
})

let prisonApi: jest.Mocked<PrisonApi>

beforeAll(() => {
  prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  prisonApi.getAgency.mockImplementation(
    (agencyId: string) =>
      new Promise((resolve, reject) => {
        if (agencyId in sampleAgencies) {
          resolve(sampleAgencies[agencyId])
        } else {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject({ status: 404, message: 'Not Found' })
        }
      }),
  )
})

let app: Express
let incentivesApi: jest.Mocked<IncentivesApi>

beforeEach(() => {
  app = appWithAllRoutes({})

  incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
  incentivesApi.getIncentiveLevels.mockResolvedValue(sampleIncentiveLevels)
  incentivesApi.getIncentiveLevel.mockResolvedValue(sampleIncentiveLevels[1])
})

afterEach(() => {
  incentivesApi.createIncentiveLevel.mockClear()
  incentivesApi.updateIncentiveLevel.mockClear()
  incentivesApi.setIncentiveLevelOrder.mockClear()
})

const tokenWithMissingRole = createUserToken([])
const tokenWithNecessaryRole = createUserToken(['ROLE_MAINTAIN_INCENTIVE_LEVELS'])

describe('Incentive level management', () => {
  it.each([
    '/incentive-levels',
    '/incentive-levels/view/STD',
    '/incentive-levels/edit/STD',
    '/incentive-levels/status/STD',
    '/incentive-levels/add',
    '/incentive-levels/reorder',
  ])('should not be accessible without correct role: %s', (url: string) => {
    return request(app)
      .get(url)
      .set('authorization', `bearer ${tokenWithMissingRole}`)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
        expect(res.headers.location).toBe('/authError')
      })
  })

  it.each([
    ['/incentive-levels', 'incentive-levels-list'],
    ['/incentive-levels/view/STD', 'incentive-levels-detail'],
    ['/incentive-levels/edit/STD', 'incentive-levels-edit'],
    ['/incentive-levels/status/STD', 'incentive-levels-status'],
    ['/incentive-levels/add', 'incentive-levels-create'],
    ['/incentive-levels/reorder', 'incentive-levels-reorder'],
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
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="incentive-levels-table"] tbody tr')
          expect($tableRows.length).toEqual(6)
          const levelNames = $tableRows
            .map((_index, tr) => {
              const levelNameCell = $(tr).find('td')[0]
              return levelNameCell.textContent.trim()
            })
            .toArray()
          expect(levelNames).toEqual(['Basic', 'Standard', 'Enhanced', 'Enhanced 2', 'Enhanced 3', 'Entry'])
          const levelCodes = $tableRows
            .map((_index, tr) => {
              const levelCodeCell = $(tr).find('td')[1]
              return levelCodeCell.textContent.trim()
            })
            .toArray()
          expect(levelCodes).toEqual(['BAS', 'STD', 'ENH', 'EN2', 'EN3', 'ENT'])
        })
    })

    it('should label the status of levels', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="incentive-levels-table"] tbody tr')
          const statuses = $tableRows
            .map((_index, tr) => {
              const statusCell = $(tr).find('td')[2]
              return statusCell.textContent.trim()
            })
            .toArray()
          expect(statuses).toEqual(['Active', 'Active', 'Active', 'Active', 'Active', 'Inactive'])
        })
    })

    it('should only show change status link for non-required levels', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="incentive-levels-table"] tbody tr')
          const canBeChanged = $tableRows
            .map((_index, tr) => {
              const changeStatusCell = $(tr).find('td')[3]
              return changeStatusCell.textContent.includes('Change status')
            })
            .toArray()
          expect(canBeChanged).toEqual([false, false, false, true, true, true])
        })
    })

    it('should not show actions if all levels are required', () => {
      incentivesApi.getIncentiveLevels.mockResolvedValue(
        sampleIncentiveLevels.filter(incentiveLevel => incentiveLevel.required),
      )
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="incentive-levels-table"] tbody tr')
          expect($tableRows.length).toEqual(3)
          $tableRows.each((_index, tr) => {
            const cell = $(tr).find('td')[3]
            expect(cell).toBeUndefined()
          })
        })
    })

    it('should always show add level button', () => {
      return request(app)
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          expect(res.text).toContain('Create a new incentive level')
        })
    })

    it('should not show links to view level details', () => {
      return request(app)
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          expect(res.text).not.toContain('/incentive-levels/view/')
        })
    })

    it('should not show links to edit level details', () => {
      return request(app)
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          expect(res.text).not.toContain('/incentive-levels/edit/')
        })
    })
  })

  // NB: Only for super-admin use; not linked to
  describe('details of a level', () => {
    type TestCase = {
      scenario: string
      sampleIncentiveLevelIndex: number
      expectedAvailability: string
    }
    const testCases: TestCase[] = [
      {
        scenario: 'a required level',
        sampleIncentiveLevelIndex: 1,
        expectedAvailability: 'Mandatory in all prisons',
      },
      {
        scenario: 'a non-required level',
        sampleIncentiveLevelIndex: 3,
        expectedAvailability: 'Available for prisons to use',
      },
      {
        scenario: 'an inactive level',
        sampleIncentiveLevelIndex: 5,
        expectedAvailability: 'Not available for prisons to use',
      },
    ]
    it.each(testCases)(
      'should show details of $scenario',
      ({ sampleIncentiveLevelIndex, expectedAvailability }: TestCase) => {
        const $ = jquery(new JSDOM().window) as unknown as typeof jquery

        const incentiveLevel = sampleIncentiveLevels[sampleIncentiveLevelIndex]
        incentivesApi.getIncentiveLevel.mockResolvedValue(incentiveLevel)

        return request(app)
          .get(`/incentive-levels/view/${incentiveLevel.code}`)
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .expect(res => {
            expect(res.text).toContain(`/incentive-levels/edit/${incentiveLevel.code}`)

            const $body = $(res.text)
            const $rowDivs = $body.find('[data-qa="incentive-level-summary-list"] .govuk-summary-list__row')
            const rows = $rowDivs
              .map((_index, div) => {
                const $divRow = $(div)
                const label = $divRow.find('dt').text().trim()
                const value = $divRow.find('dd').text().trim()
                return { label, value }
              })
              .toArray()
            const summary = Object.fromEntries(rows.map(({ label, value }) => [label, value]))
            expect(summary).toStrictEqual({
              Code: incentiveLevel.code,
              Name: incentiveLevel.name,
              Availability: expectedAvailability,
            })
          })
      },
    )

    it('should 404 if level does not exist', () => {
      const error: SanitisedError<ErrorResponse> = {
        name: 'Error',
        status: 404,
        message: 'Not Found',
        stack: 'Not Found',
      }
      incentivesApi.getIncentiveLevel.mockRejectedValue(error)

      return request(app)
        .get('/incentive-levels/view/ABC')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(404)
    })
  })

  describe('changing a level’s status', () => {
    beforeEach(() => {
      incentivesApi.getIncentiveLevel.mockResolvedValue(sampleIncentiveLevels[3])
    })

    it('should show form to change an active level’s status', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/incentive-levels/status/EN2')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('data-qa="incentive-levels-status"')

          const $body = $(res.text)
          const $form = $body.find('form')
          const formValues = Object.fromEntries($form.serializeArray().map(pair => [pair.name, pair.value]))
          expect(formValues).toHaveProperty('status', 'active')

          expect(incentivesApi.updateIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should show form to change an inactive level’s status', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      incentivesApi.getIncentiveLevel.mockResolvedValue(sampleIncentiveLevels[5])

      return request(app)
        .get('/incentive-levels/status/ENT')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('data-qa="incentive-levels-status"')

          const $body = $(res.text)
          const $form = $body.find('form')
          const formValues = Object.fromEntries($form.serializeArray().map(pair => [pair.name, pair.value]))
          expect(formValues).toHaveProperty('status', 'inactive')

          expect(incentivesApi.updateIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should be able to change a level’s status to active', () => {
      incentivesApi.getIncentiveLevel.mockResolvedValue(sampleIncentiveLevels[5])
      incentivesApi.updateIncentiveLevel.mockResolvedValue({
        ...sampleIncentiveLevels[5],
        active: true,
      })

      const form: IncentiveLevelStatusData = {
        formId: 'incentiveLevelStatusForm',
        status: 'active',
      }

      return request(app)
        .post('/incentive-levels/status/ENT')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(form)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/incentive-levels')

          expect(incentivesApi.updateIncentiveLevel).toHaveBeenCalledWith('ENT', {
            active: true,
          })
        })
    })

    it('should be able to change a level’s status to inactive', () => {
      incentivesApi.updateIncentiveLevel.mockResolvedValue({
        ...sampleIncentiveLevels[3],
        active: false,
      })

      const form: IncentiveLevelStatusData = {
        formId: 'incentiveLevelStatusForm',
        status: 'inactive',
      }

      return request(app)
        .post('/incentive-levels/status/EN2')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(form)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/incentive-levels')

          expect(incentivesApi.updateIncentiveLevel).toHaveBeenCalledWith('EN2', {
            active: false,
          })
        })
    })

    it('should show an error if status is not selected', () => {
      return request(app)
        .post('/incentive-levels/status/EN2')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({ formId: 'incentiveLevelStatusForm' })
        .expect(res => {
          expect(res.text).toContain('There is a problem')
          expect(incentivesApi.updateIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should show error message returned by api', () => {
      const error: SanitisedError<ErrorResponse> = {
        name: 'Error',
        status: 500,
        message: 'Internal Server Error',
        stack: 'Internal Server Error',
      }
      incentivesApi.updateIncentiveLevel.mockRejectedValue(error)

      const validForm: IncentiveLevelStatusData = {
        formId: 'incentiveLevelStatusForm',
        status: 'inactive',
      }

      return request(app)
        .post('/incentive-levels/status/EN2')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .redirects(1)
        .expect(res => {
          expect(res.text).toContain('Incentive level status was not saved!')
          expect(res.text).not.toContain('Internal Server Error')

          expect(incentivesApi.updateIncentiveLevel).toHaveBeenCalled()
        })
    })

    it('should show specific error message if level is active in some prisons', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      const error: SanitisedError<ErrorResponse> = {
        name: 'Error',
        status: 400,
        message: 'Bad Request',
        stack: 'Error: Bad Request',
        data: {
          status: 400,
          errorCode: 101,
          userMessage: 'Validation failure: A level must remain active if it is active in some prison',
          developerMessage: 'A level must remain active if it is active in some prison',
          moreInfo: 'MDI,WRI',
        },
      }
      incentivesApi.updateIncentiveLevel.mockRejectedValue(error)

      const validForm: IncentiveLevelStatusData = {
        formId: 'incentiveLevelStatusForm',
        status: 'inactive',
      }

      return request(app)
        .post('/incentive-levels/status/EN2')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .redirects(1)
        .expect(res => {
          expect(res.text).toContain('This level cannot be made inactive because some establishments are using it')
          expect(res.text).not.toContain('Incentive level status was not saved!')
          expect(res.text).not.toContain('Bad Request')

          const $body = $(res.text)

          const messagesBanner = $body.find('.moj-banner')
          expect(messagesBanner.length).toEqual(1)
          expect(messagesBanner.text()).toContain('Moorland')
          expect(messagesBanner.text()).toContain('Whitemoor')

          expect(incentivesApi.updateIncentiveLevel).toHaveBeenCalled()
        })
    })

    it('should 404 if level does not exist', () => {
      const error: SanitisedError<ErrorResponse> = {
        name: 'Error',
        status: 404,
        message: 'Not Found',
        stack: 'Not Found',
      }
      incentivesApi.getIncentiveLevel.mockRejectedValue(error)

      return request(app)
        .get('/incentive-levels/status/ABC')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(404)
    })
  })

  // NB: Only for super-admin use; not linked to
  describe('editing a level', () => {
    type PrefillTestCase = {
      scenario: string
      sampleIncentiveLevelIndex: number
      expectedAvailability: string
    }
    const prefillTestCases: PrefillTestCase[] = [
      {
        scenario: 'a required level',
        sampleIncentiveLevelIndex: 1,
        expectedAvailability: 'required',
      },
      {
        scenario: 'a non-required level',
        sampleIncentiveLevelIndex: 3,
        expectedAvailability: 'active',
      },
      {
        scenario: 'an inactive level',
        sampleIncentiveLevelIndex: 5,
        expectedAvailability: 'inactive',
      },
    ]
    it.each(prefillTestCases)(
      'should prefill form with details of $scenario',
      ({ sampleIncentiveLevelIndex, expectedAvailability }: PrefillTestCase) => {
        const $ = jquery(new JSDOM().window) as unknown as typeof jquery

        const incentiveLevel = sampleIncentiveLevels[sampleIncentiveLevelIndex]
        incentivesApi.getIncentiveLevel.mockResolvedValue(incentiveLevel)

        return request(app)
          .get('/incentive-levels/edit/STD')
          .set('authorization', `bearer ${tokenWithNecessaryRole}`)
          .expect(res => {
            const $body = $(res.text)
            const $form = $body.find('form')
            const formValues = Object.fromEntries($form.serializeArray().map(pair => [pair.name, pair.value]))
            expect(formValues).toHaveProperty('name', incentiveLevel.name)
            expect(formValues).toHaveProperty('availability', expectedAvailability)
          })
      },
    )

    type SuccessTestCase = {
      scenario: string
      name: string
      availability: IncentiveLevelEditData['availability']
    }
    const successTestCases: SuccessTestCase[] = [
      {
        scenario: 'no change',
        name: 'Standard',
        availability: 'required',
      },
      {
        scenario: 'a name change',
        name: 'Silver',
        availability: 'required',
      },
      {
        scenario: 'it becoming inactive',
        name: 'Standard',
        availability: 'inactive',
      },
      {
        scenario: 'it becoming not required',
        name: 'Standard',
        availability: 'active',
      },
    ]
    it.each(successTestCases)('should allow saving level details with $scenario', ({ name, availability }) => {
      const expectedActive = availability !== 'inactive'
      const expectedRequired = availability === 'required'
      incentivesApi.updateIncentiveLevel.mockResolvedValue({
        ...sampleIncentiveLevels[1],
        name,
        active: expectedActive,
        required: expectedRequired,
      })

      const form: IncentiveLevelEditData = {
        formId: 'incentiveLevelEditForm',
        name,
        availability,
      }

      return request(app)
        .post('/incentive-levels/edit/STD')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(form)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/incentive-levels/view/STD')

          expect(incentivesApi.updateIncentiveLevel).toHaveBeenCalledWith('STD', {
            name,
            active: expectedActive,
            required: expectedRequired,
          })
        })
    })

    it('should sanitise incentive level name when renamed', () => {
      // Given incentive level names should have no leading/preceding whitespaces
      const expected: IncentiveLevel = {
        code: 'EN2',
        active: true,
        name: 'Gold 2',
        required: true,
      }
      incentivesApi.updateIncentiveLevel.mockResolvedValue(expected)

      const form: IncentiveLevelEditData = {
        formId: 'incentiveLevelEditForm',
        name: '    Gold 2    ',
        availability: 'required',
      }

      // When a user edits an incentive level name that includes leading/preceding whitespaces
      // Then expect the whitespaces to have been removed
      return request(app)
        .post('/incentive-levels/edit/EN2')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(form)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/incentive-levels/view/EN2')

          expect(incentivesApi.updateIncentiveLevel).toHaveBeenCalledWith('EN2', {
            name: expected.name,
            active: expected.active,
            required: expected.required,
          })
        })
    })

    type FailureTestCase = {
      scenario: string
      errorMessage: string
      name?: unknown
      availability?: unknown
    }
    const failureTestCases: FailureTestCase[] = [
      {
        scenario: 'form is empty',
        errorMessage: 'There is a problem',
      },
      {
        scenario: 'name is missing',
        errorMessage: 'The level’s name is required',
        name: '',
        availability: 'required',
      },
      {
        scenario: 'the availability is not chosen',
        errorMessage: 'Availability must be chosen',
        name: 'Standard',
        availability: '',
      },
      {
        scenario: 'the availability is invalid',
        errorMessage: 'Availability must be chosen',
        name: 'Standard',
        availability: 'none',
      },
    ]
    it.each(failureTestCases)('should show errors when $scenario', ({ errorMessage, name, availability }) => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .post('/incentive-levels/edit/STD')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({ formId: 'incentiveLevelEditForm', name, availability })
        .expect(res => {
          const $body = $(res.text)

          const errorSummary = $body.find('.govuk-error-summary')
          expect(errorSummary.length).toEqual(1)
          expect(errorSummary.text()).toContain(errorMessage)

          expect(incentivesApi.updateIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should show error message returned by api', () => {
      const error: SanitisedError<ErrorResponse> = {
        name: 'Error',
        status: 500,
        message: 'Internal Server Error',
        stack: 'Internal Server Error',
      }
      incentivesApi.updateIncentiveLevel.mockRejectedValue(error)

      const validForm: IncentiveLevelEditData = {
        formId: 'incentiveLevelEditForm',
        name: 'Standard',
        availability: 'required',
      }

      return request(app)
        .post('/incentive-levels/edit/STD')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .redirects(1)
        .expect(res => {
          expect(res.text).toContain('Incentive level details were not saved!')
          expect(res.text).not.toContain('Internal Server Error')

          expect(incentivesApi.updateIncentiveLevel).toHaveBeenCalled()
        })
    })

    it('should show specific error message if level is active in some prisons', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      const error: SanitisedError<ErrorResponse> = {
        name: 'Error',
        status: 400,
        message: 'Bad Request',
        stack: 'Error: Bad Request',
        data: {
          status: 400,
          errorCode: 101,
          userMessage: 'Validation failure: A level must remain active if it is active in some prison',
          developerMessage: 'A level must remain active if it is active in some prison',
          moreInfo: 'MDI',
        },
      }
      incentivesApi.updateIncentiveLevel.mockRejectedValue(error)

      const validForm: IncentiveLevelEditData = {
        formId: 'incentiveLevelEditForm',
        name: 'Enhanced 2',
        availability: 'inactive',
      }

      return request(app)
        .post('/incentive-levels/edit/EN2')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .redirects(1)
        .expect(res => {
          expect(res.text).toContain('This level cannot be made inactive because some establishments are using it')
          expect(res.text).not.toContain('Incentive level status was not saved!')
          expect(res.text).not.toContain('Bad Request')

          const $body = $(res.text)

          const messagesBanner = $body.find('.moj-banner')
          expect(messagesBanner.length).toEqual(1)
          expect(messagesBanner.text()).toContain('Moorland')
          expect(messagesBanner.text()).not.toContain('Whitemoor')

          expect(incentivesApi.updateIncentiveLevel).toHaveBeenCalled()
        })
    })

    it('should 404 if level does not exist', () => {
      const error: SanitisedError<ErrorResponse> = {
        name: 'Error',
        status: 404,
        message: 'Not Found',
        stack: 'Not Found',
      }
      incentivesApi.getIncentiveLevel.mockRejectedValue(error)

      return request(app)
        .get('/incentive-levels/edit/ABC')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(404)
    })
  })

  describe('creating a new level', () => {
    it('should allow creating a new level if form is valid', () => {
      const enhanced4: IncentiveLevel = {
        code: 'EN4',
        name: 'Enhanced 4',
        active: true,
        required: false,
      }
      incentivesApi.createIncentiveLevel.mockResolvedValue(enhanced4)

      const form: IncentiveLevelCreateData = {
        formId: 'incentiveLevelCreateForm',
        name: 'Enhanced 4',
        code: 'EN4',
      }

      return request(app)
        .post('/incentive-levels/add')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(form)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/incentive-levels/status/EN4')

          expect(incentivesApi.createIncentiveLevel).toHaveBeenCalledWith(enhanced4)
        })
    })

    type FailureTestCase = {
      scenario: string
      errorMessage: string
      name?: unknown
      code?: unknown
    }
    const failureTestCases: FailureTestCase[] = [
      {
        scenario: 'form is empty',
        errorMessage: 'There is a problem',
      },
      {
        scenario: 'name is missing',
        errorMessage: 'The level’s name is required',
        name: '',
        code: 'EN4',
      },
      {
        scenario: 'code is missing',
        errorMessage: 'The level’s code must be 3 letters or numbers',
        name: 'Enhanced 4',
        code: '',
      },
      {
        scenario: 'code is too long',
        errorMessage: 'The level’s code must be 3 letters or numbers',
        name: 'Enhanced 4',
        code: 'ENH4',
      },
      {
        scenario: 'code has invalid characters',
        errorMessage: 'The level’s code must be 3 letters or numbers',
        name: 'Enhanced 4',
        code: 'E 4',
      },
    ]
    it.each(failureTestCases)('should show errors when $scenario', ({ errorMessage, name, code }) => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .post('/incentive-levels/add')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({ formId: 'incentiveLevelCreateForm', name, code })
        .expect(res => {
          const $body = $(res.text)

          const errorSummary = $body.find('.govuk-error-summary')
          expect(errorSummary.length).toEqual(1)
          expect(errorSummary.text()).toContain(errorMessage)

          expect(incentivesApi.createIncentiveLevel).not.toHaveBeenCalled()
        })
    })

    it('should show error message returned by api', () => {
      const error: SanitisedError<ErrorResponse> = {
        name: 'Error',
        status: 500,
        message: 'Internal Server Error',
        stack: 'Internal Server Error',
      }
      incentivesApi.createIncentiveLevel.mockRejectedValue(error)

      const validForm: IncentiveLevelCreateData = {
        formId: 'incentiveLevelCreateForm',
        name: 'Standard',
        code: 'STD',
      }

      return request(app)
        .post('/incentive-levels/add')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .redirects(1)
        .expect(res => {
          expect(res.text).toContain('Incentive level was not created!')
          expect(res.text).not.toContain('Internal Server Error')

          expect(incentivesApi.createIncentiveLevel).toHaveBeenCalled()
        })
    })

    it('should show specific error message if code was not unique', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      const error: SanitisedError<ErrorResponse> = {
        name: 'Error',
        status: 400,
        message: 'Bad Request',
        stack: 'Error: Bad Request',
        data: {
          status: 400,
          errorCode: 102,
          userMessage: 'Validation failure: Incentive level with code EN3 already exists',
          developerMessage: 'Incentive level with code EN3 already exists',
        },
      }
      incentivesApi.createIncentiveLevel.mockRejectedValue(error)

      const validForm: IncentiveLevelCreateData = {
        formId: 'incentiveLevelCreateForm',
        name: 'Enhanced 4',
        code: 'EN3',
      }

      return request(app)
        .post('/incentive-levels/add')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .redirects(1)
        .expect(res => {
          expect(res.text).not.toContain('Incentive level was not created!')
          expect(res.text).not.toContain('Bad Request')

          const $body = $(res.text)

          const messagesBanner = $body.find('.moj-banner')
          expect(messagesBanner.length).toEqual(1)
          expect(messagesBanner.text()).toContain('Incentive level was not created because the code must be unique')

          expect(incentivesApi.createIncentiveLevel).toHaveBeenCalled()
        })
    })
    it('should sanitise incentive level name', () => {
      // Given incentive level name should have no leading/preceding whitespaces
      const expected: IncentiveLevel = {
        code: 'EN5',
        name: 'Enhanced 5',
        active: true,
        required: false,
      }
      incentivesApi.createIncentiveLevel.mockResolvedValue(expected)

      const form: IncentiveLevelCreateData = {
        formId: 'incentiveLevelCreateForm',
        name: ' Enhanced 5   ',
        code: 'EN5',
      }

      // When a user submits a form with a name that contains leading/preceding whitespaces
      // Then expect the whitespaces to have been removed
      return request(app)
        .post('/incentive-levels/add')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(form)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/incentive-levels/status/EN5')

          expect(incentivesApi.createIncentiveLevel).toHaveBeenCalledWith(expected)
        })
    })
  })
  // NB: Only for super-admin use; not linked to
  describe('reordering levels', () => {
    type SuccessTestCase = {
      scenario: string
      code: IncentiveLevelReorderData['code']
      direction: IncentiveLevelReorderData['direction']
      expectedOrder: string[]
    }
    const successTestCases: SuccessTestCase[] = [
      {
        scenario: 'up if it’s not first',
        code: 'EN3',
        direction: 'up',
        expectedOrder: ['BAS', 'STD', 'ENH', 'EN3', 'EN2', 'ENT'],
      },
      {
        scenario: 'down if it’s not last',
        code: 'EN3',
        direction: 'down',
        expectedOrder: ['BAS', 'STD', 'ENH', 'EN2', 'ENT', 'EN3'],
      },
    ]
    it.each(successTestCases)('should allow moving a level $scenario', ({ code, direction, expectedOrder }) => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .post('/incentive-levels/reorder')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({ formId: 'incentiveLevelReorderForm', code, direction })
        .redirects(1)
        .expect(res => {
          const $body = $(res.text)

          const messagesBanner = $body.find('.moj-banner')
          expect(messagesBanner.length).toEqual(1)
          expect(messagesBanner.text()).toContain('Incentive level order was changed')

          expect(incentivesApi.setIncentiveLevelOrder).toHaveBeenCalledWith(expectedOrder)
        })
    })

    type MoveFailureTestCase = {
      scenario: string
      errorMessage: string
      code: IncentiveLevelReorderData['code']
      direction: IncentiveLevelReorderData['direction']
    }
    const moveFailureTestCases: MoveFailureTestCase[] = [
      {
        scenario: 'up if it’s first',
        errorMessage: 'Cannot move first incentive level up',
        code: 'BAS',
        direction: 'up',
      },
      {
        scenario: 'down if it’s last',
        errorMessage: 'Cannot move last incentive level down',
        code: 'ENT',
        direction: 'down',
      },
      {
        scenario: 'when it cannot be found',
        errorMessage: 'Cannot find level to move!',
        code: 'EN4',
        direction: 'down',
      },
    ]
    it.each(moveFailureTestCases)('should not allow moving a level $scenario', ({ errorMessage, code, direction }) => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .post('/incentive-levels/reorder')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({ formId: 'incentiveLevelReorderForm', code, direction })
        .redirects(1)
        .expect(res => {
          const $body = $(res.text)

          const messagesBanner = $body.find('.moj-banner')
          expect(messagesBanner.length).toEqual(1)
          expect(messagesBanner.text()).toContain(errorMessage)

          expect(incentivesApi.setIncentiveLevelOrder).not.toHaveBeenCalled()
        })
    })

    type FailureTestCase = {
      scenario: string
      errorMessage: string
      code?: unknown
      direction?: unknown
    }
    const failureTestCases: FailureTestCase[] = [
      {
        scenario: 'form is empty',
        errorMessage: 'There is a problem',
      },
      {
        scenario: 'code is missing',
        errorMessage: 'The level’s code is required',
        code: '',
        direction: 'down',
      },
      {
        scenario: 'direction is missing',
        errorMessage: 'Direction must be chosen',
        code: 'ENT',
        direction: '',
      },
      {
        scenario: 'direction is invalid',
        errorMessage: 'Direction must be chosen',
        code: 'ENT',
        direction: 'higher',
      },
    ]
    it.each(failureTestCases)('should show errors when $scenario', ({ errorMessage, code, direction }) => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .post('/incentive-levels/reorder')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({ formId: 'incentiveLevelReorderForm', code, direction })
        .expect(res => {
          const $body = $(res.text)

          const errorSummary = $body.find('.govuk-error-summary')
          expect(errorSummary.length).toEqual(1)
          expect(errorSummary.text()).toContain(errorMessage)

          expect(incentivesApi.setIncentiveLevelOrder).not.toHaveBeenCalled()
        })
    })

    it('should show error message returned by api', () => {
      const error: SanitisedError<ErrorResponse> = {
        name: 'Error',
        status: 400,
        message: 'Internal Server Error',
        stack: 'Internal Server Error',
        data: {
          status: 400,
          errorCode: 103,
          userMessage: 'Validation failure: All incentive levels required when setting order. Missing: EN3',
          developerMessage: 'All incentive levels required when setting order. Missing: EN3',
        },
      }
      incentivesApi.setIncentiveLevelOrder.mockRejectedValue(error)

      const validForm: IncentiveLevelReorderData = {
        formId: 'incentiveLevelReorderForm',
        code: 'EN2',
        direction: 'down',
      }

      return request(app)
        .post('/incentive-levels/reorder')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validForm)
        .redirects(1)
        .expect(res => {
          expect(res.text).toContain('Incentive level order was not changed!')
          expect(res.text).toContain('All incentive levels required when setting order')
          expect(res.text).not.toContain('Internal Server Error')

          expect(incentivesApi.setIncentiveLevelOrder).toHaveBeenCalled()
        })
    })
  })
})
