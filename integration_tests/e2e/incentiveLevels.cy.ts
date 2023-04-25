import type { UserRole } from '../../server/data/hmppsAuthClient'
import { sampleIncentiveLevels } from '../../server/testData/incentivesApi'
import Page from '../pages/page'
import HomePage from '../pages/home'
import IncentiveLevelsPage from '../pages/incentiveLevels/incentiveLevels'
import IncentiveLevelStatusFormPage from '../pages/incentiveLevels/incentiveLevelStatusForm'

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

  it('should allow changing the status of a non-required level', () => {
    const enhanced2 = sampleIncentiveLevels[3]
    cy.task('stubIncentiveLevel', { incentiveLevel: enhanced2 })
    cy.task('stubPatchIncentiveLevel', { incentiveLevel: { ...enhanced2, active: false } })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.manageIncentiveLevelsLink().click()

    let listPage = Page.verifyOnPage(IncentiveLevelsPage)
    listPage.contentsOfTable.its('Basic').its('changeStatus').should('be.empty')
    listPage.contentsOfTable.its('Standard').its('changeStatus').should('be.empty')
    listPage.contentsOfTable.its('Enhanced').its('changeStatus').should('be.empty')

    listPage.findTableLink(4, 'Change status').click()

    const statusPage = Page.verifyOnPage(IncentiveLevelStatusFormPage)
    statusPage.checkLastBreadcrumb()

    statusPage.statusRadios.eq(1).find('label').click()
    statusPage.form.submit()

    listPage = Page.verifyOnPage(IncentiveLevelsPage)
    listPage.messages.should('contain.text', 'Incentive level status was saved').should('contain.text', 'Enhanced 2')
  })
})
