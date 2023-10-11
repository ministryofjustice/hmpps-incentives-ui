import { resetStubs } from '../mockApis/wiremock'

import auth from '../mockApis/auth'
import tokenVerification from '../mockApis/tokenVerification'
import prisonApi from '../mockApis/prisonApi'
import incentivesApi from '../mockApis/incentivesApi'
import nomisUserRolesApi from '../mockApis/nomisUserRolesApi'
import zendeskApi from '../mockApis/zendeskApi'
import dpsComponents from '../mockApis/dpsComponents'

export default (on: (string, Record) => void): void => {
  on('task', {
    reset: resetStubs,

    ...auth,
    ...tokenVerification,

    stubIncentivesApiPing: incentivesApi.stubPing,
    stubGetIncentivesLevelBasic: incentivesApi.stubGetIncentivesLevelBasic,
    stubGetIncentivesLevelStandard: incentivesApi.stubGetIncentivesLevelStandard,
    stubGetIncentivesSorted: incentivesApi.stubGetIncentivesSorted,

    stubIncentiveLevels: incentivesApi.stubIncentiveLevels,
    stubIncentiveLevel: incentivesApi.stubIncentiveLevel,
    stubCreateIncentiveLevel: incentivesApi.stubCreateIncentiveLevel,
    stubPatchIncentiveLevel: incentivesApi.stubPatchIncentiveLevel,
    stubPrisonIncentiveLevels: incentivesApi.stubPrisonIncentiveLevels,
    stubPrisonIncentiveLevel: incentivesApi.stubPrisonIncentiveLevel,
    stubPatchPrisonIncentiveLevel: incentivesApi.stubPatchPrisonIncentiveLevel,

    stubNomisUserRolesApiPing: nomisUserRolesApi.stubPing,
    stubNomisUserRolesApiUserCaseloads: nomisUserRolesApi.stubGetUserCaseloads,

    stubDpsComponentsFail: dpsComponents.stubDpsComponentsFail,

    stubPrisonApiPing: prisonApi.stubPing,
    stubPrisonApiImages: prisonApi.stubGetImage,
    stubPrisonApiLocations: prisonApi.stubGetUserLocations,

    stubCreateZendeskTicket: zendeskApi.stubCreateTicket,
  })
}
