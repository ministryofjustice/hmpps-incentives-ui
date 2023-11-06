import UserService from './userService'
import ManageUsersApiClient, { type User } from '../data/manageUsersApiClient'
import { NomisUserRolesApi } from '../data/nomisUserRolesApi'

jest.mock('../data/manageUsersApiClient')
jest.mock('../data/nomisUserRolesApi')

const token = 'some token'

describe('UserService', () => {
  let manageUsersApiClient: jest.Mocked<ManageUsersApiClient>
  let nomisUserRolesApi: jest.Mocked<NomisUserRolesApi>
  let userService: UserService

  describe('getUser()', () => {
    beforeEach(() => {
      manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
      nomisUserRolesApi = NomisUserRolesApi.prototype as jest.Mocked<NomisUserRolesApi>
      userService = new UserService(manageUsersApiClient)
    })

    it('Retrieves and formats user name', async () => {
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)

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
      manageUsersApiClient.getUser.mockResolvedValue(authUser as User)

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

    it('Propagates error', async () => {
      manageUsersApiClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })
})
