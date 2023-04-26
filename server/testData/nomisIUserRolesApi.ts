import type { UserCaseload } from '../data/nomisUserRolesApi'

function getSingleCaseload(): UserCaseload {
  return {
    activeCaseload: {
      id: 'MDI',
      name: 'Moorland',
    },
    caseloads: [
      {
        id: 'MDI',
        name: 'Moorland',
      },
    ],
  }
}

function getMultipleCaseload(): UserCaseload {
  return {
    activeCaseload: {
      id: 'LEI',
      name: 'Leeds',
    },
    caseloads: [
      {
        id: 'MDI',
        name: 'Moorland',
      },
      {
        id: 'LEI',
        name: 'Leeds',
      },
    ],
  }
}

export { getSingleCaseload, getMultipleCaseload }
