import Page from '../../pages/page'
import HomePage from '../../pages/home'
import PrisonGroupSelection from '../../pages/analytics/prisonGroupSelection'
import AnalyticsIncentiveLevels from '../../pages/analytics/incentiveLevels'

context('Prison group selection', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.selectPrisonGroupLink().click()
  })

  it('user can select national', () => {
    const locationSelectionPage = Page.verifyOnPage(PrisonGroupSelection)
    locationSelectionPage.changePrisonGroupSelect().select('National')
    locationSelectionPage.continueButton().click()

    Page.verifyOnPage(AnalyticsIncentiveLevels)
    cy.get('.govuk-heading-xl').contains('National')
    cy.get('.govuk-heading-xl').contains('Incentive levels')
  })

  // TODO: with INC-597 we'll introduce additional prison groups and can test this
  // when a user clicks 'Select another prison group'
  // it('user can change prison group', () => {
  // })
})
