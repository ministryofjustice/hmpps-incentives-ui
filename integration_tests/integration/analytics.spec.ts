import Page from '../pages/page'
import HomePage from '../pages/home'
import AnalyticsBehaviourEntries from '../pages/analyticsBehaviourEntries'
import AnalyticsIncentiveLevels from '../pages/analyticsIncentiveLevels'
import AnalyticsProtectedCharacteristics from '../pages/analyticsProtectedCharacteristics'
import GoogleAnalyticsSpy from '../plugins/googleAnalyticsSpy'

context('Analytics', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')

    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewAnalyticsLink().click()
  })

  it('has feedback banner', () => {
    Page.verifyOnPage(AnalyticsIncentiveLevels)
    cy.get('.app-feedback-banner').contains('help us to improve it')
    cy.get('.app-feedback-banner a').invoke('attr', 'href').should('equal', 'https://example.com/analytics-feedback')
  })

  it('users see behaviour entry analytics', () => {
    const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    somePage.behaviourEntriesNavItem.click()
    const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

    page.entriesByLocation.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('410')
    })

    page.prisonersWithEntriesByLocation.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('1,227')
    })
  })

  it('users see incentive levels analytics', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    page.incentivesByLocation.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('918')
    })
  })

  it('guidance box for incentive levels analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page.incentivesByLocationGuidance
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('How you can use this chart > Incentive level by wing', 'opened', 'MDI'))
    page.incentivesByLocationGuidance
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('How you can use this chart > Incentive level by wing', 'closed', 'MDI'))
  })

  it('chart feedback box for incentive levels analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page.incentivesByLocationFeedback
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('Is this chart useful > Incentive level by wing', 'opened', 'MDI'))
    page.incentivesByLocationFeedback
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('Is this chart useful > Incentive level by wing', 'closed', 'MDI'))
  })

  it('users see protected characteristics analytics', () => {
    const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    somePage.protectedCharacteristicsNavItem.click()
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    page.incentivesByEthnicity.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('915')
    })

    page.incentivesByAgeGroup.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('918')
    })
  })

  it('guidance box for protected characteristics analytics is tracked', () => {
    const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    somePage.protectedCharacteristicsNavItem.click()
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page.incentivesByEthnicityGuidance
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('How you can use this chart > Incentive level by ethnicity', 'opened', 'MDI')
      )
    page.incentivesByEthnicityGuidance
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('How you can use this chart > Incentive level by ethnicity', 'closed', 'MDI')
      )
  })

  it('chart feedback box for protected characteristics analytics is tracked', () => {
    const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    somePage.protectedCharacteristicsNavItem.click()
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page.incentivesByAgeGroupFeedback
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('Is this chart useful > Incentive level by age group', 'opened', 'MDI'))
    page.incentivesByAgeGroupFeedback
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('Is this chart useful > Incentive level by age group', 'closed', 'MDI'))
  })
})
