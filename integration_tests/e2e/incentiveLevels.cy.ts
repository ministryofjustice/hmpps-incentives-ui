import type { UserRole } from '../../server/data/manageUsersApiClient'
import { sampleIncentiveLevels } from '../../server/testData/incentivesApi'
import type { IncentiveLevel } from '../../server/data/incentivesApi'
import Page from '../pages/page'
import HomePage from '../pages/home'
import IncentiveLevelsPage from '../pages/incentiveLevels/incentiveLevels'
import IncentiveLevelCreateFormPage from '../pages/incentiveLevels/incentiveLevelCreateForm'
import IncentiveLevelStatusFormPage from '../pages/incentiveLevels/incentiveLevelStatusForm'

context('Incentive level management', () => {
  beforeEach(() => {
    const roles: UserRole[] = [{ roleCode: 'ROLE_MAINTAIN_INCENTIVE_LEVELS' }]
    cy.task('reset')
    cy.task('stubSignIn', { roles })
    cy.task('stubNomisUserRolesGetCaseloads')
    cy.task('stubPrisonApiLocations')
    cy.task('stubManageUser')
    cy.task('stubIncentiveLevels', { inactive: true })
    cy.task('stubIncentiveLevel')

    cy.signIn()
  })

  it('shows list of levels and details of a level', () => {
    const homePage = Page.verifyOnPage(HomePage)
    homePage.manageIncentiveLevelsLink().click()

    const listPage = Page.verifyOnPage(IncentiveLevelsPage)
    listPage.checkLastBreadcrumb('Incentives', '/')

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

  it('should allow creating a new level', () => {
    const enhanced4: IncentiveLevel = { name: 'Enhanced 4', code: 'EN4', active: true, required: false }
    cy.task('stubIncentiveLevel', { incentiveLevel: enhanced4 })
    cy.task('stubCreateIncentiveLevel', { incentiveLevel: enhanced4 })
    cy.task('stubPatchIncentiveLevel', { incentiveLevel: enhanced4 })

    const homePage = Page.verifyOnPage(HomePage)
    homePage.manageIncentiveLevelsLink().click()

    let listPage = Page.verifyOnPage(IncentiveLevelsPage)
    listPage.createLink.click()

    const createPage = Page.verifyOnPage(IncentiveLevelCreateFormPage)
    createPage.checkLastBreadcrumb('Global incentive level admin', '/incentive-levels')

    createPage.form.submit() // empty form
    Page.verifyOnPage(IncentiveLevelCreateFormPage)
    createPage.errorSummaryTitle.should('contain.text', 'There is a problem')

    createPage.getInputField('name').type('Enhanced 4')
    createPage.getInputField('code').type('EN4')
    createPage.form.submit() // form should now be valid

    cy.task('stubIncentiveLevels', { incentiveLevels: [...sampleIncentiveLevels, enhanced4] })

    const statusPage = Page.verifyOnPage(IncentiveLevelStatusFormPage)
    statusPage.messages.should('not.exist')
    statusPage.form.submit()

    listPage = Page.verifyOnPage(IncentiveLevelsPage)
    listPage.messages.should('contain.text', 'Incentive level status was saved').should('contain.text', 'Enhanced 4')
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
    statusPage.checkLastBreadcrumb('Global incentive level admin', '/incentive-levels')

    statusPage.statusRadios.eq(1).find('label').click()
    statusPage.form.submit()

    listPage = Page.verifyOnPage(IncentiveLevelsPage)
    listPage.messages.should('contain.text', 'Incentive level status was saved').should('contain.text', 'Enhanced 2')
  })
})
