import Page from '../pages/page'
import AboutAnalyticsPage from '../pages/aboutAnalytics'
import HomePage from '../pages/home'

context('Home page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubNomisUserRolesGetCaseloads')
    cy.task('stubManageUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiLocations')
  })

  it('should open card when clicked anywhere inside', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.checkLastBreadcrumb('Digital Prison Service', 'http://localhost:3000')
    homePage.cards.last().find('.dps-card__description').contains('Information on how we collect').click()
    Page.verifyOnPage(AboutAnalyticsPage)
  })
})
