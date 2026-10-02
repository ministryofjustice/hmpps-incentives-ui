import Page from '../pages/page'
import AboutAnalyticsPage from '../pages/aboutAnalytics'
import HomePage from '../pages/home'

context('About Analytics page', () => {
  beforeEach(() => {
    cy.task('resetStubs')
    cy.task('stubSignIn')
    cy.task('stubFallbackHeaderAndFooter')
    cy.task('stubNomisUserRolesGetCaseloads')
    cy.task('stubManageUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonTopLevelLocations')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.aboutAnalyticsPageLink().click()
  })

  it('contains information about the charts', () => {
    const page = Page.verifyOnPage(AboutAnalyticsPage)
    page.checkLastBreadcrumb('Incentives', '/')

    cy.get('h2#about').contains('Using the data charts')
    cy.get('h2#charts').contains('Chart-specific information')
    cy.get('h2#data').contains('The data we use and how we use it')
    cy.get('h2#appendix').contains('Appendix')
  })
})
