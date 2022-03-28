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

    getSignInUrl: auth.getSignInUrl,
    stubSignIn: auth.stubSignIn,

    stubAuthUser: auth.stubUser,
    stubAuthPing: auth.stubPing,

    stubIncentivesApiPing: incentivesApi.stubPing,
    stubIncentivesApiGetLocationSummary: incentivesApi.stubGetLocationSummary,

    stubNomisUserRolesApiPing: nomisUserRolesApi.stubPing,
    stubNomisUserRolesApiUserCaseloads: nomisUserRolesApi.stubGetUserCaseloads,

    stubPrisonApiPing: prisonApi.stubPing,
    stubPrisonApiImages: prisonApi.stubGetImage,
    stubPrisonApiLocations: prisonApi.stubGetUserLocations,

    stubTokenVerificationPing: tokenVerification.stubPing,

    stubCreateZendeskTicket: zendeskApi.stubCreateTicket,
  })
}
