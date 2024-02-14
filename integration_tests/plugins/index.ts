import { resetStubs } from '../mockApis/wiremock'

import auth from '../mockApis/auth'
import tokenVerification from '../mockApis/tokenVerification'
import prisonApi from '../mockApis/prisonApi'
import incentivesApi from '../mockApis/incentivesApi'
import manageUsersApi from '../mockApis/manageUsersApi'
import nomisUserRolesApi from '../mockApis/nomisUserRolesApi'
import zendeskApi from '../mockApis/zendeskApi'
import frontendComponents from '../mockApis/frontendComponents'
import offenderSearch from '../mockApis/offenderSearch'

export default (on: (string, Record) => void): void => {
  on('task', {
    reset: resetStubs,

    ...auth,
    ...manageUsersApi,
    ...tokenVerification,
    ...frontendComponents,

    stubIncentivesApiPing: incentivesApi.stubPing,
    stubGetIncentivesLevelBasic: incentivesApi.stubGetIncentivesLevelBasic,
    stubGetIncentivesLevelStandard: incentivesApi.stubGetIncentivesLevelStandard,
    stubGetIncentivesSorted: incentivesApi.stubGetIncentivesSorted,
    stubGetIncentiveSummaryForPrisoner: incentivesApi.stubGetIncentiveSummaryForPrisoner,


    stubIncentiveLevels: incentivesApi.stubIncentiveLevels,
    stubIncentiveLevel: incentivesApi.stubIncentiveLevel,
    stubCreateIncentiveLevel: incentivesApi.stubCreateIncentiveLevel,
    stubPatchIncentiveLevel: incentivesApi.stubPatchIncentiveLevel,
    stubPrisonIncentiveLevels: incentivesApi.stubPrisonIncentiveLevels,
    stubPrisonIncentiveLevel: incentivesApi.stubPrisonIncentiveLevel,
    stubPatchPrisonIncentiveLevel: incentivesApi.stubPatchPrisonIncentiveLevel,

    stubNomisUserRolesGetCaseloads: nomisUserRolesApi.stubGetUserCaseloads,
    stubNomisUserRolesApiPing: nomisUserRolesApi.stubPing,
    stubNomisUserRolesApiUserCaseloads: nomisUserRolesApi.stubGetUserCaseloads,

    stubPrisonApiPing: prisonApi.stubPing,
    stubPrisonApiImages: prisonApi.stubGetImage,
    stubPrisonApiLocations: prisonApi.stubGetUserLocations,
    stubGetPrisonerDetails: prisonApi.stubGetPrisonerDetails,
    stubGetStaffDetails: prisonApi.stubGetStaffDetails,
    stubGetAgency: prisonApi.stubGetAgency,

    stubGetPrisoner: offenderSearch.stubGetPrisoner,

    stubCreateZendeskTicket: zendeskApi.stubCreateTicket,
  })
}
