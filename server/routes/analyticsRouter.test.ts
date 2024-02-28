import type { Express } from 'express'
import request from 'supertest'

import PrisonRegister from '../data/prisonRegister'
import config from '../config'
import ZendeskClient from '../data/zendeskClient'
import type { ChartId } from './analyticsChartTypes'
import { cache, protectedCharacteristicRoutes } from './analyticsRouter'
import { appWithAllRoutes } from './testutils/appSetup'
import { MockTable, mockSdkS3ClientResponse } from '../testData/s3Bucket'

const s3 = {
  send: jest.fn(),
}

const housesYoungPeopleOriginal = PrisonRegister.housesYoungPeople

jest.mock('@aws-sdk/client-s3', () => {
  const { GetObjectCommand, ListObjectsV2Command } = jest.requireActual('@aws-sdk/client-s3')
  return {
    S3Client: jest.fn(() => s3),
    GetObjectCommand,
    ListObjectsV2Command,
  }
})
jest.mock('../data/zendeskClient')

let originalZendeskConfig: { url: string; username: string; token: string }

let mockedZendeskClientClass: jest.Mock<ZendeskClient>

beforeAll(() => {
  const { url, username, token } = config.apis.zendesk
  originalZendeskConfig = { url, username, token }
  config.apis.zendesk.url = 'http://zendesk.local'
  config.apis.zendesk.username = 'anonymous@justice.gov.uk'
  config.apis.zendesk.token = '123456789012345678901234567890'

  mockedZendeskClientClass = ZendeskClient as jest.Mock<ZendeskClient>
})

afterAll(() => {
  config.apis.zendesk = { ...config.apis.zendesk, ...originalZendeskConfig }
})

let app: Express

beforeEach(() => {
  jest.clearAllMocks()

  app = appWithAllRoutes({})
})

describe('Home page', () => {
  it('shows card linking to incentives analytics', () => {
    return request(app)
      .get('/')
      .expect(res => expect(res.text).toContain('/analytics'))
  })
})

describe('GET /select-pgd-region', () => {
  it('renders prison pgdRegionCode page', () => {
    return request(app)
      .get('/analytics/select-pgd-region')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select a view')
        expect(res.text).toContain('Select national or a prison group')
        expect(res.text).toContain('<option value="National">National')
        expect(res.text).toContain('<option value="WM">West Midlands')
      })
  })
})

describe('POST /select-pgd-region', () => {
  describe('when pgdRegionCode is missing', () => {
    it('redirects to pgdRegion selection page', () => {
      return request(app)
        .post('/analytics/select-pgd-region')
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/analytics/select-pgd-region')
        })
    })
  })

  describe('Invalid pgdRegionCode', () => {
    it('redirects to pgdRegion selection page from Behaviour entries page', () => {
      return request(app)
        .get('/analytics/test/behaviour-entries')
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/analytics/select-pgd-region')
        })
    })

    it('redirects to pgdRegion selection page from Incentive levels page', () => {
      return request(app)
        .get('/analytics/test/incentive-levels')
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/analytics/select-pgd-region')
        })
    })

    it('redirects to pgdRegion selection page from Protected Characteristic page', () => {
      return request(app)
        .get('/analytics/test/protected-characteristic?characteristic=disability')
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/analytics/select-pgd-region')
        })
    })
  })

  describe('Valid pgdRegionCode', () => {
    it('routes to the National incentive level page', () => {
      return request(app)
        .post('/analytics/select-pgd-region')
        .send({ pgdRegionCode: 'National' })
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/analytics/National/incentive-levels')
        })
    })

    it('routes to the West Midlands incentive level page', () => {
      return request(app)
        .post('/analytics/select-pgd-region')
        .send({ pgdRegionCode: 'WM' })
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/analytics/WM/incentive-levels')
        })
    })
  })
})

type AnalyticsPage = {
  name: string
  url: string
  expectedHeading: string
  linksFromCharts?: string[]
  chartIds: ChartId[]
}

const analyticsPages: AnalyticsPage[] = [
  {
    name: 'National Behaviour entries',
    url: '/analytics/National/behaviour-entries',
    expectedHeading: 'Comparison of positive and negative behaviour entries by prison group – last 28 days',
    chartIds: ['entries-by-location', 'prisoners-with-entries-by-location', 'trends-entries'],
    linksFromCharts: [
      '/analytics/LTHS/behaviour-entries',
      '/analytics/WLS/behaviour-entries',
      '/analytics/YRKS/behaviour-entries',
    ],
  },
  {
    name: 'PGD region Behaviour entries',
    url: '/analytics/LTHS/behaviour-entries',
    expectedHeading: 'Comparison of positive and negative behaviour entries by establishment – last 28 days',
    chartIds: ['entries-by-location', 'prisoners-with-entries-by-location', 'trends-entries'],
  },
  {
    name: 'Prison (MDI) Behaviour entries',
    url: '/analytics/behaviour-entries',
    expectedHeading: 'Comparison of positive and negative behaviour entries by residential location – last 28 days',
    linksFromCharts: [
      '/incentive-summary/MDI-1',
      '/incentive-summary/MDI-2',
      '/incentive-summary/MDI-3',
      '/incentive-summary/MDI-4',
      '/incentive-summary/MDI-5',
      '/incentive-summary/MDI-6',
      '/incentive-summary/MDI-7',
      '/incentive-summary/MDI-8',
      '/incentive-summary/MDI-SEG',
    ],
    chartIds: ['entries-by-location', 'prisoners-with-entries-by-location', 'trends-entries'],
  },
  {
    name: 'National Incentive levels',
    url: '/analytics/National/incentive-levels',
    expectedHeading: 'Percentage and number of prisoners on each incentive level by prison group',
    chartIds: ['incentive-levels-by-location', 'trends-incentive-levels'],
    linksFromCharts: [
      '/analytics/LTHS/incentive-levels',
      '/analytics/WLS/incentive-levels',
      '/analytics/YRKS/incentive-levels',
    ],
  },
  {
    name: 'PGD region Incentive levels',
    url: '/analytics/LTHS/incentive-levels',
    expectedHeading: 'Percentage and number of prisoners on each incentive level by establishment',
    chartIds: ['incentive-levels-by-location', 'trends-incentive-levels'],
  },
  {
    name: 'Prison (MDI) Incentive levels',
    url: '/analytics/incentive-levels',
    expectedHeading: 'Percentage and number of prisoners on each incentive level by residential location',
    linksFromCharts: [
      '/incentive-summary/MDI-1',
      '/incentive-summary/MDI-2',
      '/incentive-summary/MDI-3',
      '/incentive-summary/MDI-4',
      '/incentive-summary/MDI-5',
      '/incentive-summary/MDI-6',
      '/incentive-summary/MDI-7',
      '/incentive-summary/MDI-8',
      '/incentive-summary/MDI-SEG',
    ],
    chartIds: ['incentive-levels-by-location', 'trends-incentive-levels'],
  },
  {
    name: 'National Protected characteristics',
    url: '/analytics/National/protected-characteristic?characteristic=disability',
    expectedHeading: 'Percentage and number of prisoners by recorded disability',
    chartIds: [
      'population-by-disability',
      'incentive-levels-by-disability',
      'trends-incentive-levels-by-disability',
      'entries-by-disability',
      'trends-entries-by-disability',
      'prisoners-with-entries-by-disability',
    ],
  },
  {
    name: 'PGD region Protected characteristics',
    url: '/analytics/LTHS/protected-characteristic?characteristic=disability',
    expectedHeading: 'Percentage and number of prisoners by recorded disability',
    chartIds: [
      'population-by-disability',
      'incentive-levels-by-disability',
      'trends-incentive-levels-by-disability',
      'entries-by-disability',
      'trends-entries-by-disability',
      'prisoners-with-entries-by-disability',
    ],
  },
  {
    name: 'Prison (MDI) Protected characteristics',
    url: '/analytics/protected-characteristic?characteristic=disability',
    expectedHeading: 'Percentage and number of prisoners on each incentive level by recorded disability',
    chartIds: [
      'population-by-disability',
      'incentive-levels-by-disability',
      'trends-incentive-levels-by-disability',
      'entries-by-disability',
      'trends-entries-by-disability',
      'prisoners-with-entries-by-disability',
    ],
  },
]

describe.each(analyticsPages)('Analytics data pages', ({ name, url, expectedHeading, chartIds, linksFromCharts }) => {
  beforeEach(() => {
    mockSdkS3ClientResponse(s3.send)
    cache.clear()
  })

  it(`${name} page loads`, () => {
    return request(app)
      .get(url)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain(expectedHeading)
        expect(res.text).not.toContain('Page not found')
      })
  })

  it(`error is presented on ${name} page if no source table was found`, () => {
    mockSdkS3ClientResponse(s3.send, MockTable.Missing)

    return request(app)
      .get(url)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain(expectedHeading)
        expect(res.text).toContain('There is a problem with this data – try again later')
      })
  })

  it(`error is presented on ${name} page if source table contains no data`, () => {
    mockSdkS3ClientResponse(s3.send, MockTable.Empty)

    return request(app)
      .get(url)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain(expectedHeading)
        expect(res.text).toContain('There is a problem with this data – try again later')
      })
  })

  if (linksFromCharts) {
    it(`${name} page has charts that link to PGD region charts or incentive table for location`, () => {
      return request(app)
        .get(url)
        .expect(res => {
          linksFromCharts.forEach(link => {
            expect(res.text).toContain(`href="${link}"`)
          })
        })
    })
  }

  it(`shows a disclaimer on ${name} page`, () => {
    return request(app)
      .get(url)
      .expect(res => {
        expect(res.text).toContain('Information on how we collect, group and analyse data')
      })
  })

  describe.each(chartIds)('charts have feedback forms', chartId => {
    beforeAll(() => {
      mockSdkS3ClientResponse(s3.send)
    })

    it(`${name} page can post simple feedback on ${chartId} chart`, () => {
      return request(app)
        .post(url)
        .send({ formId: chartId, chartUseful: 'yes' })
        .expect(200)
        .expect(res => {
          expect(res.text).toContain(expectedHeading)
          expect(mockedZendeskClientClass).toHaveBeenCalled()
          const mockedZendeskClient = mockedZendeskClientClass.mock.instances[0] as jest.Mocked<ZendeskClient>
          expect(mockedZendeskClient.createTicket).toHaveBeenCalledWith({
            subject: `Feedback on chart ${chartId}`,
            comment: { body: expect.any(String) },
            type: 'task',
            tags: ['hmpps-incentives', 'chart-feedback', `chart-${chartId}`, 'useful-yes'],
            custom_fields: [
              // Service
              { id: 23757677, value: 'hmpps_incentives' },
              // Environment
              { id: 32342378, value: config.environment },
              // URL
              { id: 23730083, value: expect.stringContaining(url) },
              // Prison
              { id: 23984153, value: 'MDI' },
            ],
          })
          const createTicketRequest = mockedZendeskClient.createTicket.mock.calls[0][0]
          expect(createTicketRequest.comment.body).toContain('Is this chart useful? yes')
          expect(createTicketRequest.comment.body).toContain('Prison: MDI')
          expect(createTicketRequest.comment.body).not.toContain('Comments:')
        })
    })

    it(`${name} page can post more complex feedback on ${chartId} chart`, () => {
      return request(app)
        .post(url)
        .send({
          formId: chartId,
          chartUseful: 'no',
          mainNoReason: 'do-not-understand',
          noComments: 'How do I use this?',
        })
        .expect(200)
        .expect(res => {
          expect(res.text).toContain(expectedHeading)
          expect(res.text).toContain('Your feedback has been submitted')
          const mockedZendeskClient = mockedZendeskClientClass.mock.instances[0] as jest.Mocked<ZendeskClient>
          expect(mockedZendeskClient.createTicket).toHaveBeenCalledWith({
            subject: expect.any(String),
            comment: { body: expect.any(String) },
            type: 'task',
            tags: [
              'hmpps-incentives',
              'chart-feedback',
              `chart-${chartId}`,
              'useful-no',
              'not-useful-do-not-understand',
            ],
            custom_fields: expect.anything(),
          })
          expect(mockedZendeskClientClass).toHaveBeenCalled()
          const createTicketRequest = mockedZendeskClient.createTicket.mock.calls[0][0]
          expect(createTicketRequest.comment.body).toContain('Is this chart useful? no')
          expect(createTicketRequest.comment.body).toContain('Prison: MDI')
          expect(createTicketRequest.comment.body).toContain('Main reason: do-not-understand')
          expect(createTicketRequest.comment.body).toContain('Comments:')
          expect(createTicketRequest.comment.body).toContain('How do I use this?')
        })
    })

    it(`${name} page will not post invalid feedback on ${chartId} chart`, () => {
      return request(app)
        .post(url)
        .send({
          formId: chartId,
          chartUseful: 'no',
          noComments: 'Do I have to choose only one reason?',
        })
        .expect(200)
        .expect(res => {
          expect(res.text).toContain(expectedHeading)
          expect(res.text).not.toContain('Your feedback has been submitted')
          expect(res.text).toContain('There is a problem') // error summary
          expect(res.text).toContain(`#${chartId}-mainNoReason`) // link to field
          expect(res.text).toContain('Select a reason for your answer') // error message
          expect(res.text).toContain(`id="${chartId}-mainNoReason"`) // field with error
          expect(res.text).toContain('Do I have to choose only one reason?') // comment not forgotten
          expect(mockedZendeskClientClass).not.toHaveBeenCalled()
        })
    })
  })

  it(`${name} page will not accept a post without a formId parameter`, () => {
    return request(app)
      .post(url)
      .send({ chartUseful: 'yes' })
      .expect(400)
      .expect(res => {
        expect(res.text).toContain('Sorry, there is a problem with the service')
        expect(mockedZendeskClientClass).not.toHaveBeenCalled()
      })
  })
})

// Tests specific of Protected Characteristic pages
describe('Protected characteristic pages', () => {
  it('Age page is the default when none is explicitly selected', () => {
    return request(app)
      .get('/analytics/protected-characteristic')
      .expect(200)
      .expect(res => {
        expect(res.text).not.toContain('Page not found')
        // correct template
        expect(res.text).toContain('Protected characteristics')
        // correct characteristic
        expect(res.text).toContain('table-incentive-levels-by-age')
      })
  })

  it('Invalid characteristic name results in 404', () => {
    return request(app)
      .get('/analytics/protected-characteristic?characteristic=invalid')
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  describe.each(['trendsIncentiveLevelsGroup', 'trendsEntriesGroup'])(
    'Protected characteristic route',
    queryParamName => {
      it(`responds 404 Not Found when value for ${queryParamName} query parameter is invalid`, () => {
        return request(app)
          .get(`/analytics/protected-characteristic?characteristic=ethnicity&${queryParamName}=66+`)
          .expect(404)
          .expect(res => {
            expect(res.text).toContain('Page not found')
          })
      })

      describe('when prison is Youth Custody Service', () => {
        beforeAll(() => {
          // change housesYoungPeople() to always return true
          PrisonRegister.housesYoungPeople = (_prisonId: string) => true
        })

        afterAll(() => {
          // restore PrisonRegister.housesYoungPeople() behaviour
          PrisonRegister.housesYoungPeople = housesYoungPeopleOriginal
        })

        it(`${queryParamName} value can be 15-17`, () => {
          return request(app)
            .get(`/analytics/protected-characteristic?characteristic=age&${queryParamName}=15-17`)
            .expect(200)
            .expect(res => {
              expect(res.text).toContain('Protected characteristics')
            })
        })

        it('PC groups defaults to 15-17', () => {
          return request(app)
            .get('/analytics/protected-characteristic?characteristic=age')
            .expect(200)
            .expect(res => {
              expect(res.text).toContain('<option value="15-17" selected>15-17</option>')
            })
        })
      })

      describe('when prison is not Youth Custody Service', () => {
        beforeAll(() => {
          // change housesYoungPeople() to always return false
          PrisonRegister.housesYoungPeople = (_prisonId: string) => false
        })

        afterAll(() => {
          // restore PrisonRegister.housesYoungPeople() behaviour
          PrisonRegister.housesYoungPeople = housesYoungPeopleOriginal
        })

        it(`${queryParamName} value cannot be 15-17`, () => {
          return request(app)
            .get(`/analytics/protected-characteristic?characteristic=age&${queryParamName}=15-17`)
            .expect(404)
            .expect(res => {
              expect(res.text).toContain('Not Found')
            })
        })

        it('PC groups defaults to 18-25', () => {
          return request(app)
            .get('/analytics/protected-characteristic?characteristic=age')
            .expect(200)
            .expect(res => {
              expect(res.text).toContain('<option value="18-25" selected>18-25</option>')
              // doesn't show option for Young People
              expect(res.text).not.toContain('<option value="15-17">15-17</option>')
            })
        })
      })
    },
  )
})

describe.each(Object.entries(protectedCharacteristicRoutes))(
  'Protected characteristic pages',
  (characteristicName, { label }) => {
    beforeEach(() => {
      mockSdkS3ClientResponse(s3.send)
      cache.clear()
    })

    const url = `/analytics/protected-characteristic?characteristic=${characteristicName}`

    it(`${label} page shows correct charts`, () => {
      return request(app)
        .get(url)
        .expect(200)
        .expect(res => {
          const pageContent = res.text
          expect(pageContent).not.toContain('Page not found')
          // correct template
          expect(pageContent).toContain('Protected characteristics')

          // correct characteristic charts
          expect(pageContent).toContain(`table-population-by-${characteristicName}`)
          expect(pageContent).toContain(`table-incentive-levels-by-${characteristicName}`)
          expect(pageContent).toContain(`table-trends-incentive-levels-by-${characteristicName}`)
          expect(pageContent).toContain(`table-entries-by-${characteristicName}`)
          expect(pageContent).toContain(`table-trends-entries-by-${characteristicName}`)
          expect(pageContent).toContain(`table-prisoners-with-entries-by-${characteristicName}`)
        })
    })

    it(`${label} page drop-down has expected list of characteristics options`, () => {
      return request(app)
        .get(url)
        .expect(200)
        .expect(res => {
          const pageContent = res.text
          const selectElementHtml = pageContent.slice(pageContent.indexOf('<select'), pageContent.indexOf('</select>'))
          let lastCharacteristicPosition = 0
          Object.keys(protectedCharacteristicRoutes).forEach(someCharacteristicName => {
            const characteristicPosition = selectElementHtml.indexOf(`value="${someCharacteristicName}"`)
            expect(characteristicPosition).toBeGreaterThan(lastCharacteristicPosition)
            lastCharacteristicPosition = characteristicPosition
          })
        })
    })
  },
)
