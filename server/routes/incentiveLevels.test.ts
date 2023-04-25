import type { Express } from 'express'
import jquery from 'jquery'
import { JSDOM } from 'jsdom'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import createUserToken from './testutils/createUserToken'
import { sampleIncentiveLevels } from '../testData/incentivesApi'
import { IncentivesApi, type ErrorResponse } from '../data/incentivesApi'
import type { SanitisedError } from '../sanitisedError'
import type { IncentiveLevelData } from './forms/incentiveLevelForm'

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
  incentivesApi.getIncentiveLevel.mockResolvedValue(sampleIncentiveLevels[1])
})

afterEach(() => {
  incentivesApi.updateIncentiveLevel.mockClear()
  incentivesApi.setIncentiveLevelOrder.mockClear()
})

const tokenWithMissingRole = createUserToken([])
const tokenWithNecessaryRole = createUserToken(['ROLE_MAINTAIN_INCENTIVE_LEVELS'])

describe('Incentive level management', () => {
  it.each(['/incentive-levels', '/incentive-levels/view/STD', '/incentive-levels/edit/STD'])(
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
    ['/incentive-levels', 'incentive-levels-list'],
    ['/incentive-levels/view/STD', 'incentive-levels-detail'],
    ['/incentive-levels/edit/STD', 'incentive-levels-form'],
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
      availability: IncentiveLevelData['availability']
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

      const form: IncentiveLevelData = {
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
        status: 500,
        message: 'Internal Server Error',
        stack: 'Internal Server Error',
      }
      incentivesApi.updateIncentiveLevel.mockRejectedValue(error)

      const validForm: IncentiveLevelData = {
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

    it('should 404 if level does not exist', () => {
      const error: SanitisedError<ErrorResponse> = {
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
})
