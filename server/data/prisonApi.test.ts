import nock from 'nock'

import config from '../config'
import { PrisonApi } from './prisonApi'

describe('PrisonApi', () => {
  let prisonApi: nock.Scope
  let prisonApiClient: PrisonApi

  const accessToken = 'test token'
  const prisonerNumber = 'A1234BC'

  beforeEach(() => {
    prisonApi = nock(config.apis.hmppsPrisonApi.url)
    prisonApiClient = new PrisonApi(accessToken)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getImageByPrisonerNumber()', () => {
    it('should return an image', async () => {
      const imageData = Buffer.from('image data')
      prisonApi
        .get(`/api/bookings/offenderNo/${prisonerNumber}/image/data`)
        .query({ fullSizeImage: 'false' })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, imageData, { 'Content-Type': 'image/jpeg' })

      const response = await prisonApiClient.getImageByPrisonerNumber(prisonerNumber)
      expect(response).toEqual(imageData)
    })

    it('should return null if not found', async () => {
      prisonApi
        .get(`/api/bookings/offenderNo/${prisonerNumber}/image/data`)
        .query({ fullSizeImage: 'false' })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .thrice()
        .reply(404)

      const response = await prisonApiClient.getImageByPrisonerNumber(prisonerNumber)
      expect(response).toBeNull()
    })

    it('should return null if unauthorised', async () => {
      prisonApi
        .get(`/api/bookings/offenderNo/${prisonerNumber}/image/data`)
        .query({ fullSizeImage: 'false' })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .thrice()
        .reply(403)

      const response = await prisonApiClient.getImageByPrisonerNumber(prisonerNumber)
      expect(response).toBeNull()
    })

    it('should throw when it receives another error', async () => {
      prisonApi
        .get(`/api/bookings/offenderNo/${prisonerNumber}/image/data`)
        .query({ fullSizeImage: 'false' })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .thrice()
        .reply(500)

      await expect(prisonApiClient.getImageByPrisonerNumber(prisonerNumber)).rejects.toThrow('Internal Server Error')
    })
  })
})
