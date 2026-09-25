import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes, MockUserService } from './testutils/appSetup'
import { makeMockUser } from './testutils/mockUsers'
import getTestLocation from '../testData/locationsInsidePrisonApi'
import { mockSdkS3ClientResponse } from '../testData/s3Bucket'
import { LocationsInsidePrisonApi } from '../data/locationsInsidePrisonApi'
import { cache } from './analyticsRouter'

jest.mock('@ministryofjustice/hmpps-auth-clients')
jest.mock('../data/locationsInsidePrisonApi')

const s3 = {
  send: jest.fn(),
}
jest.mock('@aws-sdk/client-s3', () => {
  const { GetObjectCommand, ListObjectsV2Command } = jest.requireActual('@aws-sdk/client-s3')
  return {
    S3Client: jest.fn(() => s3),
    GetObjectCommand,
    ListObjectsV2Command,
  }
})

let app: Express
let locationsInsidePrisonApi: jest.Mocked<LocationsInsidePrisonApi>

beforeEach(() => {
  jest.clearAllMocks()

  locationsInsidePrisonApi = LocationsInsidePrisonApi.prototype as jest.Mocked<LocationsInsidePrisonApi>
  locationsInsidePrisonApi.getTopLevelPrisonLocations.mockResolvedValue([
    getTestLocation({
      fullLocationPath: '1',
      localName: 'Houseblock 1',
    }),
  ])

  app = appWithAllRoutes({})
})

describe('Home page', () => {
  const incentiveReviewTileIds = ['incentive-information', 'about-national-policy']
  const analyticsChartTileIds = ['incentive-analytics', 'select-pgd-region', 'about-data']

  describe('when user’s active case load has "locations"', () => {
    // a prison case load would have locations (e.g. wings or house blocks) so can see location-specific tiles

    it.each(incentiveReviewTileIds)('shows incentive review management tile: %s', tileId => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain(`data-test="${tileId}"`)
        })
    })

    it.each(analyticsChartTileIds)('shows analytics chart tile: %s', tileId => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain(`data-test="${tileId}"`)
        })
    })
  })

  describe('when user’s active case load has no "locations"', () => {
    // an LSA's special case load (CADM_I) has no locations so cannot see location-specific tiles

    beforeEach(() => {
      locationsInsidePrisonApi.getTopLevelPrisonLocations.mockResolvedValue([])
    })

    it.each(incentiveReviewTileIds)('does not show incentive review management tile: %s', tileId => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).not.toContain(`data-test="${tileId}"`)
        })
    })

    it('does not show analytics chart tile: incentive-analytics', () => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).not.toContain('data-test="incentive-analytics"')
        })
    })

    it('shows analytics chart tile: select-pgd-region', () => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain('data-test="select-pgd-region"')
        })
    })

    it('shows analytics chart tile: about-data', () => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain('data-test="about-data"')
        })
    })
  })

  describe('admin section', () => {
    it('does not show if user does not have appropriate role', () => {
      app = appWithAllRoutes({})

      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).not.toContain('data-qa="admin-section"')
        })
    })

    it('shows tile to manage incentive levels if user has appropriate role', () => {
      app = appWithAllRoutes({
        mockUserService: new MockUserService(makeMockUser({ roles: ['MAINTAIN_INCENTIVE_LEVELS'] })),
      })

      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain('data-qa="admin-section"')
          expect(res.text).toContain('data-test="manage-incentive-levels"')
          expect(res.text).not.toContain('data-test="manage-prison-incentive-levels"')
        })
    })

    it('shows tile to manage incentive levels if user has appropriate role even without having any locations in active case load', () => {
      app = appWithAllRoutes({
        mockUserService: new MockUserService(makeMockUser({ roles: ['MAINTAIN_INCENTIVE_LEVELS'] })),
      })
      locationsInsidePrisonApi.getTopLevelPrisonLocations.mockResolvedValue([])

      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain('data-qa="admin-section"')
          expect(res.text).toContain('data-test="manage-incentive-levels"')
          expect(res.text).not.toContain('data-test="manage-prison-incentive-levels"')
        })
    })

    it('shows tile to manage prison incentive levels if user has appropriate role and there are locations in active case load', () => {
      app = appWithAllRoutes({
        mockUserService: new MockUserService(makeMockUser({ roles: ['MAINTAIN_PRISON_IEP_LEVELS'] })),
      })

      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain('data-qa="admin-section"')
          expect(res.text).not.toContain('data-test="manage-incentive-levels"')
          expect(res.text).toContain('data-test="manage-prison-incentive-levels"')
        })
    })

    it('does not show tile to manage prison incentive levels if active case load does not have locations even if user has appropriate role', () => {
      app = appWithAllRoutes({
        mockUserService: new MockUserService(makeMockUser({ roles: ['MAINTAIN_PRISON_IEP_LEVELS'] })),
      })
      locationsInsidePrisonApi.getTopLevelPrisonLocations.mockResolvedValue([])

      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).not.toContain('data-qa="admin-section"')
          expect(res.text).not.toContain('data-test="manage-incentive-levels"')
          expect(res.text).not.toContain('data-test="manage-prison-incentive-levels"')
        })
    })
  })
})

describe('About visualisations page', () => {
  const url = '/about'

  beforeEach(() => {
    mockSdkS3ClientResponse(s3.send)
    cache.clear()
  })

  it('lists prisons using analytics table', () => {
    return request(app)
      .get(url)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Wales')
        expect(res.text).toContain('Berwyn (HMP & YOI)')
        expect(s3.send).toHaveBeenCalledTimes(2) // once to list tables and once to retrieve
      })
  })
})

describe('Product info', () => {
  it('should return product ID', () => {
    return request(app)
      .get('/info')
      .expect('Content-Type', /application\/json/)
      .expect(res => {
        expect(res.body).toHaveProperty('productId', 'DPS???')
      })
  })
})
