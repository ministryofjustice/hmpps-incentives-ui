import type { Caseload } from '../../data/nomisUserRolesApi'
import type { UserDetails } from '../../services/userService'
import { sampleAgencies } from '../../testData/prisonApi'
import createUserToken from './createUserToken'

export function makeCaseload(caseload: string): Caseload {
  const agency = sampleAgencies[caseload]
  return {
    id: agency.agencyId,
    name: agency.description,
  }
}

export function makeMockUser({
  caseloads = ['MDI'],
  roles = [],
}: {
  caseloads?: string[]
  roles?: string[]
} = {}): Express.User {
  const caseloadObjects = caseloads.map(makeCaseload)
  const activeCaseload = caseloadObjects[0]
  const mockUserDetails: UserDetails = {
    name: 'john smith',
    userId: 'id1',
    authSource: 'NOMIS',
    username: 'user1',
    displayName: 'John Smith',
    active: true,
    activeCaseLoadId: activeCaseload.id,
    activeCaseload,
    caseloads: [activeCaseload],
  }
  const authorities = roles.map(role => (role.startsWith('ROLE_') ? role : `ROLE_${role}`))
  return {
    ...mockUserDetails,
    token: createUserToken(authorities),
    roles: authorities,
  }
}

/**
 * User in MDI with no roles
 */
export const mockUser = makeMockUser()
