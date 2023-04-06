import { resetStubs } from '../mockApis/wiremock'

import auth from '../mockApis/auth'
import tokenVerification from '../mockApis/tokenVerification'
import prisonApi from '../mockApis/prisonApi'
import incentivesApi from '../mockApis/incentivesApi'
import nomisUserRolesApi from '../mockApis/nomisUserRolesApi'
import zendeskApi from '../mockApis/zendeskApi'

export default (on: (string, Record) => void): void => {
  on('task', {
    reset: resetStubs,

    ...auth,
    ...tokenVerification,

    stubIncentivesApiPing: incentivesApi.stubPing,
    stubIncentivesApiGetLocationSummary: incentivesApi.stubGetLocationSummary,
    stubGetAvailableLevels: incentivesApi.stubGetAvailableLevels,
    stubGetReviews: incentivesApi.stubGetReviews,
    stubGetIncentivesLevelStandard: incentivesApi.stubGetIncentivesLevelStandard,
    stubGetIncentivesSorted: incentivesApi.stubGetIncentivesSorted,

    stubNomisUserRolesApiPing: nomisUserRolesApi.stubPing,
    stubNomisUserRolesApiUserCaseloads: nomisUserRolesApi.stubGetUserCaseloads,

    stubPrisonApiPing: prisonApi.stubPing,
    stubPrisonApiImages: prisonApi.stubGetImage,
    stubPrisonApiLocations: prisonApi.stubGetUserLocations,

    stubCreateZendeskTicket: zendeskApi.stubCreateTicket,
  })
}
