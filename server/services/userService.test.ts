import UserService from './userService'
import HmppsAuthClient, { User } from '../data/hmppsAuthClient'
import { PrisonApi } from '../data/prisonApi'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/prisonApi')

const token = 'some token'

describe('UserService', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let prisonApi: jest.Mocked<PrisonApi>
  let userService: UserService

  describe('getUser()', () => {
    beforeEach(() => {
      hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
      prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
      userService = new UserService(hmppsAuthClient)
    })

    it('retrieves and formats user name', async () => {
      hmppsAuthClient.getUser.mockResolvedValue({ name: 'john smith' } as User)

      const result = await userService.getUser(token)

      expect(result.displayName).toEqual('John Smith')
    })

    it('returns activeCaseLoad and activeCaseLoads', async () => {
      const authUser = {
        name: 'john smith',
        activeCaseLoadId: 'MDI',
      }
      hmppsAuthClient.getUser.mockResolvedValue(authUser as User)

      const activeCaseLoad = {
        caseLoadId: 'MDI',
        description: 'Moorland (HMP & YOI)',
        currentlyActive: true,
        type: 'INST',
      }
      const allCaseLoads = [
        {
          caseLoadId: 'TEST',
          description: 'Test Prison',
          currentlyActive: false,
          type: 'INST',
        },
        activeCaseLoad,
      ]
      prisonApi.getUserCaseLoads.mockResolvedValue(allCaseLoads)

      const result = await userService.getUser(token)

      expect(result.activeCaseLoad).toEqual(activeCaseLoad)
      expect(result.activeCaseLoads).toEqual(allCaseLoads)
    })

    it('propagates error', async () => {
      hmppsAuthClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })
})
