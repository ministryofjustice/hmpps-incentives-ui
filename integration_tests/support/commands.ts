Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }) => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

Cypress.Commands.add('navigateToPrisonerIncentiveLevelDetails', () => {
  cy.signIn()
  cy.task('stubGetPrisonerDetails')
  cy.task('stubGetStaffDetails', {
    staffId: 'INCENTIVES_API',
    json: {
      username: 'INCENTIVES_API',
      firstName: '',
      lastName: '',
    },
  })
  cy.task('stubGetStaffDetails', {
    staffId: 'STAFF_USER',
    json: {
      username: 'STAFF_USER',
      firstName: 'Staff',
      lastName: 'User',
    },
  })
  cy.task('stubGetStaffDetails', {
    staffId: 'ANOTHER_USER',
    json: {
      username: 'ANOTHER_USER',
      firstName: 'Another',
      lastName: 'User',
    },
  })
  cy.task('stubGetAgency', {
    agencyId: 'LEI',
    json: {
      agencyId: 'LEI',
      description: 'Leeds (HMP)',
      agencyType: 'INST',
      active: true,
    },
  })
  cy.task('stubGetAgency', {
    agencyId: 'MDI',
    json: {
      agencyId: 'MDI',
      description: 'Moorland (HMP & YOI)',
      agencyType: 'INST',
      active: true,
    },
  })
  cy.task('stubGetPrisoner')

  cy.visit('/incentive-reviews/prisoner/A1234A')
})
