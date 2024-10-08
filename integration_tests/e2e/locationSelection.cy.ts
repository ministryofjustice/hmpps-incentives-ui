import Page from '../pages/page'
import HomePage from '../pages/home'
import LocationSelectionPage from '../pages/locationSelection'

context('Location selection', () => {
  beforeEach(() => {
    cy.task('resetStubs')
    cy.task('stubSignIn')
    cy.task('stubFallbackHeaderAndFooter')
    cy.task('stubNomisUserRolesGetCaseloads')
    cy.task('stubManageUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiImages')
    cy.task('stubPrisonApiLocations')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewIncentivesLevelsLink().click()
  })

  it('user sees correct locations for their active case load', () => {
    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)
    locationSelectionPage.checkLastBreadcrumb('Incentives', '/')
    locationSelectionPage.locationSelectOptions().should('contain.text', 'Houseblock 2')
    locationSelectionPage.locationSelectOptions().should('contain.text', 'Houseblock 42')
  })
})
