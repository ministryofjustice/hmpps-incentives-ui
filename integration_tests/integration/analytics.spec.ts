import Page from '../pages/page'
import HomePage from '../pages/home'
import type AnalyticsPage from '../pages/analytics'
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
      testValidFeedbackSubmission(AnalyticsBehaviourEntries, [
        ['entriesByLocationFeedback', 'entriesByLocationFeedbackForm'],
        ['prisonersWithEntriesByLocationFeedback', 'prisonersWithEntriesByLocationFeedbackForm'],
      ])
    })

    it('users will see errors if they submit invalid feedback on chart', () => {
      testInvalidFeedbackSubmission(AnalyticsBehaviourEntries, [
        ['entriesByLocationFeedback', 'entriesByLocationFeedbackForm'],
        ['prisonersWithEntriesByLocationFeedback', 'prisonersWithEntriesByLocationFeedbackForm'],
      ])
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
      testValidFeedbackSubmission(AnalyticsIncentiveLevels, [
        ['incentivesByLocationFeedback', 'incentivesByLocationFeedbackForm'],
      ])
    })

    it('users will see errors if they submit invalid feedback on chart', () => {
      testInvalidFeedbackSubmission(AnalyticsIncentiveLevels, [
        ['incentivesByLocationFeedback', 'incentivesByLocationFeedbackForm'],
      ])
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
      testValidFeedbackSubmission(AnalyticsProtectedCharacteristics, [
        ['incentivesByEthnicityFeedback', 'incentivesByEthnicityFeedbackForm'],
        ['incentivesByAgeGroupFeedback', 'incentivesByAgeGroupFeedbackForm'],
      ])
    })

    it('users will see errors if they submit invalid feedback on chart', () => {
      testInvalidFeedbackSubmission(AnalyticsProtectedCharacteristics, [
        ['incentivesByEthnicityFeedback', 'incentivesByEthnicityFeedbackForm'],
        ['incentivesByAgeGroupFeedback', 'incentivesByAgeGroupFeedbackForm'],
      ])
    })
  })
})

function testValidFeedbackSubmission<PageClass extends AnalyticsPage>(pageClass: new () => PageClass, feedbackBoxes) {
  feedbackBoxes.forEach(([feedbackBox, feedbackForm]) => {
    const page = Page.verifyOnPage(pageClass)

    // open feedback box and select "yes"
    page[feedbackBox].click()
    page[feedbackForm].find('[name=chartUseful][value=yes]').click()
    page[feedbackForm].submit()

    // should remain on the same page
    Page.verifyOnPage(pageClass)
  })
}

function testInvalidFeedbackSubmission<PageClass extends AnalyticsPage>(pageClass: new () => PageClass, feedbackBoxes) {
  feedbackBoxes.forEach(([feedbackBox, feedbackForm]) => {
    let page = Page.verifyOnPage(pageClass)

    // open feedback box and select "no", typing some comments
    page[feedbackBox].click()
    page[feedbackForm].find('[name=chartUseful][value=no]').click()
    page[feedbackForm].find('[name=noComments]').type('I’m confused')
    page[feedbackForm].submit()

    // should remain on the same page
    page = Page.verifyOnPage(pageClass)

    // error summary should have 1 error message
    page.errorSummaryTitle.contains('There is a problem')
    page.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Select a reason for your answer')
    })
    // feedback box should be open already
    page[feedbackBox].parent().should('have.attr', 'open')
    // "no" should already be checked
    page[feedbackForm].find('[name=chartUseful][value=no]').should('have.attr', 'checked')
    // typed comments should still be there
    page[feedbackForm].find('[name=noComments]').should('have.value', 'I’m confused')
    // same error message should show
    page[feedbackForm].find('p.govuk-error-message').contains('Select a reason for your answer')
  })
}
