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

  it('users see behaviour entry analytics', () => {
    const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    somePage.behaviourEntriesNavItem.click()
    const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

    page.entriesByLocation.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('441')
    })

    page.prisonersWithEntriesByLocation.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('1,425')
    })
  })

  it('users see incentive levels analytics', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    page.incentivesByLocation.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('1,144')
    })
  })

  it('guidance box for incentive levels analytics is tracked', () => {
    Page.verifyOnPage(AnalyticsIncentiveLevels)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    cy.get('.govuk-details__summary')
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('How you can use this chart > Incentive level by wing', 'opened', 'MDI'))
    cy.get('.govuk-details__summary')
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('How you can use this chart > Incentive level by wing', 'closed', 'MDI'))
  })

  it('users see protected characteristics analytics', () => {
    const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    somePage.protectedCharacteristicsNavItem.click()
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    page.incentivesByEthnicity.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('1,144')
    })

    page.incentivesByAgeGroup.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('1,144')
    })
  })

  it('guidance box for protected characteristics analytics is tracked', () => {
    const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    somePage.protectedCharacteristicsNavItem.click()
    Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    cy.get('.govuk-details__summary')
      .first()
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('How you can use this chart > Incentive level by ethnicity', 'opened', 'MDI')
      )
    cy.get('.govuk-details__summary')
      .first()
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('How you can use this chart > Incentive level by ethnicity', 'closed', 'MDI')
      )
  })
})
