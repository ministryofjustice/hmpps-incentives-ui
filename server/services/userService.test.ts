import UserService from './userService'
import HmppsAuthClient, { User } from '../data/hmppsAuthClient'
import { NomisUserRolesApi } from '../data/nomisUserRolesApi'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/nomisUserRolesApi')

const token = 'some token'

describe('UserService', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let nomisUserRolesApi: jest.Mocked<NomisUserRolesApi>
  let userService: UserService

  describe('getUser()', () => {
    beforeEach(() => {
      hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
      nomisUserRolesApi = NomisUserRolesApi.prototype as jest.Mocked<NomisUserRolesApi>
      userService = new UserService(hmppsAuthClient)
    })

    it('retrieves and formats user name', async () => {
      hmppsAuthClient.getUser.mockResolvedValue({ name: 'john smith' } as User)

      nomisUserRolesApi.getUserCaseloads.mockResolvedValue({
        activeCaseload: {
          id: 'MDI',
          name: 'Moorland (HMP & YOI)',
        },
        caseloads: [
          {
            id: 'MDI',
            name: 'Moorland (HMP & YOI)',
          },
        ],
      })

      const result = await userService.getUser(token)

      expect(result.displayName).toEqual('John Smith')
    })

    it('returns activeCaseload and activeCaseloads', async () => {
      const authUser = {
        name: 'john smith',
      }
      hmppsAuthClient.getUser.mockResolvedValue(authUser as User)

      const activeCaseload = {
        id: 'MDI',
        name: 'Moorland (HMP & YOI)',
      }
      const allCaseloads = [
        {
          id: 'TEST',
          name: 'Test Prison',
        },
      ]
      const userCaseloads = {
        activeCaseload,
        caseloads: allCaseloads,
      }

      nomisUserRolesApi.getUserCaseloads.mockResolvedValue(userCaseloads)

      const result = await userService.getUser(token)

      expect(result.activeCaseload).toEqual(activeCaseload)
      expect(result.caseloads).toEqual(allCaseloads)
    })

    it('propagates error', async () => {
      hmppsAuthClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })
})
