import Page from '../pages/page'
import HomePage from '../pages/home'
import AnalyticsBehaviourEntries from '../pages/analyticsBehaviourEntries'
import AnalyticsIncentiveLevels from '../pages/analyticsIncentiveLevels'
import AnalyticsProtectedCharacteristics from '../pages/analyticsProtectedCharacteristics'
import GoogleAnalyticsSpy from '../plugins/googleAnalyticsSpy'

context('Analytics section', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubCreateZendeskTicket')

    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewAnalyticsLink().click()
  })

  it('has feedback banner', () => {
    Page.verifyOnPage(AnalyticsIncentiveLevels)
    cy.get('.app-feedback-banner').contains('help us to improve it')
    cy.get('.app-feedback-banner a').invoke('attr', 'href').should('equal', 'https://example.com/analytics-feedback')
  })

  context('behaviour entries page', () => {
    beforeEach(() => {
      const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
      somePage.behaviourEntriesNavItem.click()
    })

    it('users see analytics', () => {
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

    it('guidance box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page.entriesByLocationGuidance
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('How you can use this chart > Behaviour entries by wing', 'opened', 'MDI')
        )
      page.entriesByLocationGuidance
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('How you can use this chart > Behaviour entries by wing', 'closed', 'MDI')
        )

      page.prisonersWithEntriesByLocationGuidance
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent(
            'How you can use this chart > Prisoners with behaviour entries by wing',
            'opened',
            'MDI'
          )
        )
      page.prisonersWithEntriesByLocationGuidance
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent(
            'How you can use this chart > Prisoners with behaviour entries by wing',
            'closed',
            'MDI'
          )
        )
    })

    it('chart feedback box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page.entriesByLocationFeedback
        .click()
        .then(() => gaSpy.shouldHaveSentEvent('Is this chart useful > Behaviour entries by wing', 'opened', 'MDI'))
      page.entriesByLocationFeedback
        .click()
        .then(() => gaSpy.shouldHaveSentEvent('Is this chart useful > Behaviour entries by wing', 'closed', 'MDI'))

      page.prisonersWithEntriesByLocationFeedback
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('Is this chart useful > Prisoners with behaviour entries by wing', 'opened', 'MDI')
        )
      page.prisonersWithEntriesByLocationFeedback
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('Is this chart useful > Prisoners with behaviour entries by wing', 'closed', 'MDI')
        )
    })

    it('users can submit feedback on charts', () => {
      let page = Page.verifyOnPage(AnalyticsBehaviourEntries)

      page.entriesByLocationFeedback.click()
      page.entriesByLocationFeedbackForm.find('[name=chartUseful]').first().click()
      page.entriesByLocationFeedbackForm.submit()

      page = Page.verifyOnPage(AnalyticsBehaviourEntries)

      page.prisonersWithEntriesByLocationFeedback.click()
      page.prisonersWithEntriesByLocationFeedbackForm.find('[name=chartUseful]').first().click()
      page.prisonersWithEntriesByLocationFeedbackForm.submit()
    })
  })

  context('incentive levels page', () => {
    it('users see analytics', () => {
      const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

      page.incentivesByLocation.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('918')
      })
    })

    it('guidance box for analytics is tracked', () => {
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

    it('chart feedback box for analytics is tracked', () => {
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

    it('users can submit feedback on chart', () => {
      const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

      page.incentivesByLocationFeedback.click()
      page.incentivesByLocationFeedbackForm.find('[name=chartUseful]').first().click()
      page.incentivesByLocationFeedbackForm.submit()

      Page.verifyOnPage(AnalyticsIncentiveLevels)
    })
  })

  context('protected characteristics page', () => {
    beforeEach(() => {
      const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
      somePage.protectedCharacteristicsNavItem.click()
    })

    it('users see analytics', () => {
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

    it('guidance box for analytics is tracked', () => {
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

      page.incentivesByAgeGroupGuidance
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('How you can use this chart > Incentive level by age group', 'opened', 'MDI')
        )
      page.incentivesByAgeGroupGuidance
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('How you can use this chart > Incentive level by age group', 'closed', 'MDI')
        )
    })

    it('chart feedback box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page.incentivesByEthnicityFeedback
        .click()
        .then(() => gaSpy.shouldHaveSentEvent('Is this chart useful > Incentive level by ethnicity', 'opened', 'MDI'))
      page.incentivesByEthnicityFeedback
        .click()
        .then(() => gaSpy.shouldHaveSentEvent('Is this chart useful > Incentive level by ethnicity', 'closed', 'MDI'))

      page.incentivesByAgeGroupFeedback
        .click()
        .then(() => gaSpy.shouldHaveSentEvent('Is this chart useful > Incentive level by age group', 'opened', 'MDI'))
      page.incentivesByAgeGroupFeedback
        .click()
        .then(() => gaSpy.shouldHaveSentEvent('Is this chart useful > Incentive level by age group', 'closed', 'MDI'))
    })

    it('users can submit feedback on charts', () => {
      let page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

      page.incentivesByEthnicityFeedback.click()
      page.incentivesByEthnicityFeedbackForm.find('[name=chartUseful]').first().click()
      page.incentivesByEthnicityFeedbackForm.submit()

      page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

      page.incentivesByAgeGroupFeedback.click()
      page.incentivesByAgeGroupFeedbackForm.find('[name=chartUseful]').first().click()
      page.incentivesByAgeGroupFeedbackForm.submit()
    })
  })
})
