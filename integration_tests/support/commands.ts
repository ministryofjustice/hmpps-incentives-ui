import type { Agency, Staff } from '../../server/data/prisonApi'
import GoogleAnalyticsTracker, { type GtagCall } from './googleAnalyticsTracker'

Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }) => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

Cypress.Commands.add('navigateToPrisonerIncentiveLevelDetails', () => {
  cy.signIn()
  cy.task('stubGetPrisonerFullDetailsFalse')
  cy.task('stubGetPrisoner')

  cy.task('stubGetStaffDetails', {
    staffId: 1001,
    username: 'INCENTIVES_API',
    firstName: '',
    lastName: '',
    active: true,
    activeCaseLoadId: undefined,
  } satisfies Staff)
  cy.task('stubGetStaffDetails', {
    staffId: 1002,
    username: 'STAFF_USER',
    firstName: 'Staff',
    lastName: 'User',
    active: true,
    activeCaseLoadId: 'MDI',
  } satisfies Staff)
  cy.task('stubGetStaffDetails', {
    staffId: 1003,
    username: 'ANOTHER_USER',
    firstName: 'Another',
    lastName: 'User',
    active: true,
    activeCaseLoadId: 'LEI',
  } satisfies Staff)

  cy.task('stubGetAgency', {
    agencyId: 'LEI',
    description: 'Leeds (HMP)',
    agencyType: 'INST',
    active: true,
  } satisfies Agency)
  cy.task('stubGetAgency', {
    agencyId: 'MDI',
    description: 'Moorland (HMP & YOI)',
    agencyType: 'INST',
    active: true,
  } satisfies Agency)

  cy.visit('/incentive-reviews/prisoner/A8083DY')
})

Cypress.Commands.add('navigateToChangePrisonerIncentiveLevelDetails', () => {
  cy.signIn()
  cy.task('stubGetIncentiveSummaryForPrisoner')
  cy.task('stubGetPrisonerFullDetailsFalse')
  cy.task('stubPrisonIncentiveLevels')
  cy.task('stubGetPrisonerDetails')

  cy.visit('/incentive-reviews/prisoner/A8083DY/change-incentive-level')
})

Cypress.Commands.add('trackGoogleAnalyticsCalls', (): Cypress.Chainable<GoogleAnalyticsTracker> => {
  const tracker = new GoogleAnalyticsTracker()
  cy.window().then(win => {
    // eslint-disable-next-line no-param-reassign
    win.gtag = (...args: GtagCall) => {
      tracker.trackCall(args)
    }
  })
  return cy.wrap(tracker)
})
