import Page from '../pages/page'
import AboutAnalyticsPage from '../pages/aboutAnalytics'
import HomePage from '../pages/home'

context('Home page', () => {
  beforeEach(() => {
    cy.task('resetStubs')
    cy.task('stubSignIn')
    cy.task('stubFallbackHeaderAndFooter')
    cy.task('stubNomisUserRolesGetCaseloads')
    cy.task('stubManageUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonTopLevelLocations')
  })

  it('should open card when clicked anywhere inside', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.checkLastBreadcrumb('Digital Prison Service', 'http://localhost:3000')
    homePage.cards.last().find('.dps-card__description').contains('Information on how we collect').click()
    Page.verifyOnPage(AboutAnalyticsPage)
  })
})
