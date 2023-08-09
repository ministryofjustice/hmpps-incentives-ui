import Page from '../../pages/page'
import HomePage from '../../pages/home'
import PgdRegionSelection from '../../pages/analytics/pgdRegionSelection'
import AnalyticsIncentiveLevels from '../../pages/analytics/incentiveLevels'

context('Prison group selection', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonApiLocations')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.selectPgdRegionLink().click()
  })

  it('user can select national', () => {
    const locationSelectionPage = Page.verifyOnPage(PgdRegionSelection)
    locationSelectionPage.checkLastBreadcrumb('Incentives', '/')
    locationSelectionPage.changePgdRegionSelect().select('National')
    locationSelectionPage.continueButton().click()

    Page.verifyOnPage(AnalyticsIncentiveLevels)
    cy.get('.govuk-heading-xl').contains('National')
    cy.get('.govuk-heading-xl').contains('Incentive levels')
  })

  it('user can navigate back to the change pgdRegion screen', () => {
    const locationSelectionPage = Page.verifyOnPage(PgdRegionSelection)
    locationSelectionPage.changePgdRegionSelect().select('National')
    locationSelectionPage.continueButton().click()

    cy.get('.pgd-region a').click()
    Page.verifyOnPage(PgdRegionSelection)
  })
})
