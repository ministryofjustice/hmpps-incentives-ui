import nock from 'nock'

import config from '../config'
import {
  getSingleCaseload,
  getMultipleCaseload,
  getSingleCaseloadResult,
  getMultipleCaseloadResult,
} from '../testData/nomisIUserRolesApi'
import { NomisUserRolesApi } from './nomisUserRolesApi'

const accessToken = 'test token'

describe('NomisUserRolesA[o', () => {
  let nomisUserRolesApi: nock.Scope
  let nomisUserRolesApiClient: NomisUserRolesApi

  beforeEach(() => {
    nomisUserRolesApi = nock(config.apis.nomisUserRolesApi.url)
    nomisUserRolesApiClient = new NomisUserRolesApi(accessToken)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getUserWithSingleCaseload', () => {
    it('returns data from Nomis User Roles API for a user with a single caseload', async () => {
      const apiResponse = getSingleCaseload()
      nomisUserRolesApi
        .get(`/me/caseloads`)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, apiResponse)

      const result = await nomisUserRolesApiClient.getUserCaseloads()

      expect(result).toEqual(getSingleCaseloadResult())
    })
  })

  describe('getUserWithMultipleCaseload', () => {
    it('returns data from Nomis User Roles API for a user with multiple caseloads', async () => {
      const apiResponse = getMultipleCaseload()
      nomisUserRolesApi
        .get(`/me/caseloads`)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, apiResponse)

      const result = await nomisUserRolesApiClient.getUserCaseloads()

      expect(result).toEqual(getMultipleCaseloadResult())
    })
  })
})
