import { testInvalidFeedbackSubmission, testValidFeedbackSubmission } from './utils'
import Page from '../../pages/page'
import HomePage from '../../pages/home'
import AnalyticsIncentiveLevels from '../../pages/analyticsIncentiveLevels'
import AnalyticsProtectedCharacteristics from '../../pages/analyticsProtectedCharacteristics'
import GoogleAnalyticsSpy from '../../plugins/googleAnalyticsSpy'

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

  context('protected characteristics page', () => {
    beforeEach(() => {
      const somePage = Page.verifyOnPage(AnalyticsIncentiveLevels)
      somePage.protectedCharacteristicsNavItem.click()
    })

    it('users see analytics', () => {
      const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

      page.populationByAge.first().then(totalsRow => {
        const location = totalsRow.find('td:nth-child(3)').text()
        expect(location).to.contain('921')
      })

      page.incentivesByAge.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('921')
      })

      page.entriesByAge.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('921')
      })
    })

    it('selector allows user to change protected characteristic', () => {
      cy.get('#characteristic').select('Sexual orientation')
      cy.get('#form-select-characteristic button').click()

      cy.get('h2.govuk-heading-m')
        .first()
        .contains('Percentage and number of prisoners in the establishment by sexual orientation')
    })

    it('guidance box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page
        .getGraphGuidance('incentive-levels-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level by age',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphGuidance('incentive-levels-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level by age',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphGuidance('entries-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Behaviour entries by age',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphGuidance('entries-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Behaviour entries by age',
            action: 'closed',
            label: 'MDI',
          })
        )
    })

    it('chart feedback box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page
        .getGraphFeedback('population-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Population by age',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('population-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Population by age',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphFeedback('incentive-levels-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level by age',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('incentive-levels-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level by age',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphFeedback('entries-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Behaviour entries by age',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('entries-by-age')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Behaviour entries by age',
            action: 'closed',
            label: 'MDI',
          })
        )
    })

    it('users can submit feedback on charts', () => {
      testValidFeedbackSubmission(AnalyticsProtectedCharacteristics, [
        'population-by-age',
        'incentive-levels-by-age',
        'entries-by-age',
      ])
    })

    it('users will see errors if they submit invalid feedback on chart', () => {
      testInvalidFeedbackSubmission(AnalyticsProtectedCharacteristics, [
        'population-by-age',
        'incentive-levels-by-age',
        'entries-by-age',
      ])
    })
  })
})
