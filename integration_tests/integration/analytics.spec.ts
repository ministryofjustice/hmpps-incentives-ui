import Page from '../pages/page'
import HomePage from '../pages/home'
import AnalyticsIndex from '../pages/analyticsIndex'
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

  it('users see analytics index page with cards', () => {
    const expectedCards = ['Incentive levels', 'Behaviour entries', 'Protected characteristics']

    const page = Page.verifyOnPage(AnalyticsIndex)
    page.cards.each((card, index) => {
      const link = card.find('.card__link')
      expect(link.text().trim()).to.equal(expectedCards[index])
    })
  })

  it('users see behaviour entry analytics', () => {
    const indexPage = Page.verifyOnPage(AnalyticsIndex)
    indexPage.behaviourEntriesCard.find('a').click()
    const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

    page.entriesByLocation.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('361')
    })

    page.prisonersWithEntriesByLocation.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('1,379')
    })
  })

  it('users see incentive levels analytics', () => {
    const indexPage = Page.verifyOnPage(AnalyticsIndex)
    indexPage.incentiveLevelsCard.find('a').click()
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    page.incentivesByLocation.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('1,527')
    })
  })

  it('guidance box for incentive levels analytics is tracked', () => {
    const indexPage = Page.verifyOnPage(AnalyticsIndex)
    indexPage.incentiveLevelsCard.find('a').click()
    Page.verifyOnPage(AnalyticsIncentiveLevels)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    cy.get('.govuk-details__summary')
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('Help using this chart > Incentive level by wing', 'opened', 'MDI'))
    cy.get('.govuk-details__summary')
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('Help using this chart > Incentive level by wing', 'closed', 'MDI'))
  })

  it('users see protected characteristics analytics', () => {
    const indexPage = Page.verifyOnPage(AnalyticsIndex)
    indexPage.protectedCharacteristicsCard.find('a').click()
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    page.incentivesByEthnicity.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('1,522')
    })

    page.incentivesByAgeGroup.first().then(totalsRow => {
      const location = totalsRow.find('td:first-child').text()
      expect(location).to.contain('All')
      expect(location).to.contain('1,524')
    })
  })

  it('guidance box for protected characteristics analytics is tracked', () => {
    const indexPage = Page.verifyOnPage(AnalyticsIndex)
    indexPage.protectedCharacteristicsCard.find('a').click()
    Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    cy.get('.govuk-details__summary')
      .first()
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('Help using this chart > Incentive level by ethnicity', 'opened', 'MDI'))
    cy.get('.govuk-details__summary')
      .first()
      .click()
      .then(() => gaSpy.shouldHaveSentEvent('Help using this chart > Incentive level by ethnicity', 'closed', 'MDI'))
  })
})
