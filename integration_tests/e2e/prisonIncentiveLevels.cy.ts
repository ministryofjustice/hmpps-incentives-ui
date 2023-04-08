import Page from '../pages/page'
import type { UserRole } from '../../server/data/hmppsAuthClient'
import HomePage from '../pages/home'
import PrisonIncentiveLevelPage from '../pages/prisonIncentiveLevels/prisonIncentiveLevel'
import PrisonIncentiveLevelsPage from '../pages/prisonIncentiveLevels/prisonIncentiveLevels'

context('Prison incentive level management', () => {
  beforeEach(() => {
    const roles: UserRole[] = [{ roleCode: 'ROLE_MAINTAIN_PRISON_IEP_LEVELS' }]
    cy.task('reset')
    cy.task('stubSignIn', { roles })
    cy.task('stubAuthUser', { roles })
    cy.task('stubIncentiveLevels')
    cy.task('stubIncentiveLevel')
    cy.task('stubPrisonIncentiveLevels')
    cy.task('stubPrisonIncentiveLevel')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.managePrisonIncentiveLevelsLink().click()
  })

  it('shows list of levels and details of a level', () => {
    const listPage = Page.verifyOnPage(PrisonIncentiveLevelsPage)
    listPage.checkLastBreadcrumb()
    listPage.contentsOfTable.should('have.all.key', 'Basic', 'Standard', 'Enhanced')
    listPage.contentsOfTable
      .its('Standard')
      .then(([tags, _links]) => tags)
      .should('contain', 'Default')

    listPage.findTableLink(1, 'View settings').click()

    const detailPage = Page.verifyOnPage(PrisonIncentiveLevelPage, 'Standard')
    detailPage.checkLastBreadcrumb()
    detailPage.contentsOfTables
      .should('have.length', 4)
      .should('deep.equal', [
        { 'Default for new prisoners': 'Yes' },
        { 'Remand prisoners': '£60.50 per week', 'Convicted prisoners': '£19.80 per week' },
        { 'Remand prisoners': '£605', 'Convicted prisoners': '£198' },
        { Visits: '1 per 2 weeks', 'Privileged visits': '2 per 4 weeks' },
      ])

    detailPage.returnLink.click()
    Page.verifyOnPage(PrisonIncentiveLevelsPage)
  })
})
