import type { UserRole } from '../../server/data/hmppsAuthClient'
import Page from '../pages/page'
import HomePage from '../pages/home'
import IncentiveLevelsPage from '../pages/incentiveLevels/incentiveLevels'

context('Incentive level management', () => {
  beforeEach(() => {
    const roles: UserRole[] = [{ roleCode: 'ROLE_MAINTAIN_INCENTIVE_LEVELS' }]
    cy.task('reset')
    cy.task('stubSignIn', { roles })
    cy.task('stubAuthUser', { roles })
    cy.task('stubPrisonApiLocations')
    cy.task('stubIncentiveLevels', { inactive: true })
    cy.task('stubIncentiveLevel')

    cy.signIn()
  })

  it('shows list of levels and details of a level', () => {
    const homePage = Page.verifyOnPage(HomePage)
    homePage.manageIncentiveLevelsLink().click()

    const listPage = Page.verifyOnPage(IncentiveLevelsPage)
    listPage.checkLastBreadcrumb()
    listPage.contentsOfTable.should(
      'have.all.key',
      'Basic',
      'Standard',
      'Enhanced',
      'Enhanced 2',
      'Enhanced 3',
      'Entry',
    )
    listPage.contentsOfTable.its('Standard').its('status').should('contain', 'Active')
    listPage.contentsOfTable.its('Entry').its('status').should('contain', 'Inactive')
  })
})
