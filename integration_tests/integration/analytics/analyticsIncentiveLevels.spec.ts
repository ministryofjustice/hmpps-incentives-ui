import { getTextFromTable, testInvalidFeedbackSubmission, testValidFeedbackSubmission } from './utils'
import Page from '../../pages/page'
import HomePage from '../../pages/home'
import AnalyticsIncentiveLevels from '../../pages/analyticsIncentiveLevels'
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

  context('incentive levels page', () => {
    it('users see analytics', () => {
      const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

      page.incentivesByLocation.first().then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('921')
      })

      getTextFromTable(page.incentivesTrends).then(rows => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_basicRow, standardRow, _enhancedRow, populationRow] = rows
        // remove header column
        standardRow.shift()
        populationRow.shift()

        expect(standardRow.map(text => text.split(/\s/)[0])).to.deep.equal(
          // monthly average population on standard level
          ['571', '568', '572', '567', '554', '552', '555', '568', '561', '534', '533', '543']
        )
        expect(populationRow).to.deep.equal(
          // monthly average population
          ['929', '917', '932', '937', '928', '921', '926', '930', '935', '920', '915', '922']
        )
      })
    })

    it('guidance box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page
        .getGraphGuidance('incentive-levels-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level by wing',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphGuidance('incentive-levels-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level by wing',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphGuidance('trends-incentive-levels')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level trends',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphGuidance('trends-incentive-levels')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'How you can use this chart > Incentive level trends',
            action: 'closed',
            label: 'MDI',
          })
        )
    })

    it('chart feedback box for analytics is tracked', () => {
      const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

      const gaSpy = new GoogleAnalyticsSpy()
      gaSpy.install()

      page
        .getGraphFeedback('incentive-levels-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level by wing',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('incentive-levels-by-location')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level by wing',
            action: 'closed',
            label: 'MDI',
          })
        )

      page
        .getGraphFeedback('trends-incentive-levels')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level trends',
            action: 'opened',
            label: 'MDI',
          })
        )
      page
        .getGraphFeedback('trends-incentive-levels')
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: 'Is this chart useful > Incentive level trends',
            action: 'closed',
            label: 'MDI',
          })
        )
    })

    it('users can submit feedback on chart', () => {
      testValidFeedbackSubmission(AnalyticsIncentiveLevels, ['incentive-levels-by-location', 'trends-incentive-levels'])
    })

    it('users will see errors if they submit invalid feedback on chart', () => {
      testInvalidFeedbackSubmission(AnalyticsIncentiveLevels, [
        'incentive-levels-by-location',
        'trends-incentive-levels',
      ])
    })
  })
})
