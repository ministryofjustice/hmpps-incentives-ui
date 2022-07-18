import { getTextFromTable, testInvalidFeedbackSubmission, testValidFeedbackSubmission } from './utils'
import Page from '../../pages/page'
import HomePage from '../../pages/home'
import AnalyticsIncentiveLevels from '../../pages/analytics/incentiveLevels'
import GoogleAnalyticsSpy from '../../plugins/googleAnalyticsSpy'
import PgdRegionSelection from '../../pages/analytics/pgdRegionSelection'

context('Analytics section > Incentive levels page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubCreateZendeskTicket')

    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewAnalyticsLink().click()
    Page.verifyOnPage(AnalyticsIncentiveLevels)
  })

  it('has correct title', () => {
    cy.title().should('eq', 'Manage incentives – Incentive levels – Prison')
  })

  it('has feedback banner', () => {
    cy.get('.app-feedback-banner').contains('help us to improve it')
    cy.get('.app-feedback-banner a').invoke('attr', 'href').should('equal', 'https://example.com/analytics-feedback')
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    page
      .getChartTable('incentive-levels-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('929')
      })

    getTextFromTable(page.getChartTable('trends-incentive-levels')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_basicRow, standardRow, _enhancedRow, populationRow] = rows
      // remove header column
      standardRow.shift()

      expect(standardRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly average population on standard level
        ['568', '572', '567', '554', '552', '555', '568', '561', '534', '533', '543', '531'],
      )
      expect(populationRow).to.deep.equal(
        // monthly average population
        ['Prison population', '917', '932', '937', '928', '921', '926', '930', '935', '920', '915', '922', '909'],
      )
    })
  })

  it('guidance box for analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page
      .getChartGuidance('incentive-levels-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by wing (Prison)',
          action: 'opened',
          label: 'MDI',
        }),
      )

    page
      .getChartGuidance('trends-incentive-levels')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level trends (Prison)',
          action: 'opened',
          label: 'MDI',
        }),
      )
  })

  it('chart feedback box for analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page
      .getChartFeedback('incentive-levels-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by wing (Prison)',
          action: 'opened',
          label: 'MDI',
        }),
      )

    page
      .getChartFeedback('trends-incentive-levels')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level trends (Prison)',
          action: 'opened',
          label: 'MDI',
        }),
      )
  })

  it('users can submit feedback on chart', () => {
    testValidFeedbackSubmission(AnalyticsIncentiveLevels, ['incentive-levels-by-location', 'trends-incentive-levels'])
  })

  it('users will see errors if they submit invalid feedback on chart', () => {
    testInvalidFeedbackSubmission(AnalyticsIncentiveLevels, ['incentive-levels-by-location', 'trends-incentive-levels'])
  })
})

context('Pgd Region selection > National > Analytics section > Incentive levels page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.selectPgdRegionLink().click()
    const locationSelectionPage = Page.verifyOnPage(PgdRegionSelection)
    locationSelectionPage.changePgdRegionSelect().select('National')
    locationSelectionPage.continueButton().click()
    Page.verifyOnPage(AnalyticsIncentiveLevels)
  })

  it('has correct title', () => {
    cy.title().should('eq', 'Manage incentives – Incentive levels – National')
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    page
      .getChartTable('incentive-levels-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('3,117')
      })

    getTextFromTable(page.getChartTable('trends-incentive-levels')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_basicRow, standardRow, _enhancedRow, populationRow] = rows
      // remove header column
      standardRow.shift()

      expect(standardRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly average population on standard level
        ['1,590', '1,544', '1,470', '1,405', '1,388', '1,403', '1,421', '1,427', '1,383', '1,353', '1,360', '1,359'],
      )
      expect(populationRow).to.deep.equal(
        // monthly average population
        [
          'National population',
          '3,077',
          '3,070',
          '3,059',
          '3,047',
          '3,036',
          '3,057',
          '3,060',
          '3,066',
          '3,054',
          '3,059',
          '3,064',
          '3,069',
        ],
      )
    })
  })

  it('guidance box for analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page
      .getChartGuidance('incentive-levels-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by prison group (National)',
          action: 'opened',
          label: 'MDI',
        }),
      )

    page
      .getChartGuidance('trends-incentive-levels')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level trends (National)',
          action: 'opened',
          label: 'MDI',
        }),
      )
  })

  it('chart feedback box for analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page
      .getChartFeedback('incentive-levels-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by prison group (National)',
          action: 'opened',
          label: 'MDI',
        }),
      )

    page
      .getChartFeedback('trends-incentive-levels')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level trends (National)',
          action: 'opened',
          label: 'MDI',
        }),
      )
  })
})

context('Pgd Region selection > LTHS > Analytics section > Incentive levels page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.selectPgdRegionLink().click()
    const locationSelectionPage = Page.verifyOnPage(PgdRegionSelection)
    locationSelectionPage.changePgdRegionSelect().select('LTHS')
    locationSelectionPage.continueButton().click()
    Page.verifyOnPage(AnalyticsIncentiveLevels)
  })

  it('has correct title', () => {
    cy.title().should('eq', 'Manage incentives – Incentive levels – Long-term and high security')
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    page
      .getChartTable('incentive-levels-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('319')
      })

    getTextFromTable(page.getChartTable('trends-incentive-levels')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_basicRow, standardRow, _enhancedRow, populationRow] = rows
      // remove header column
      standardRow.shift()

      expect(standardRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly average population on standard level
        ['133', '116', '100', '92', '95', '96', '98', '103', '104', '112', '106', '101'],
      )
      expect(populationRow).to.deep.equal(
        // monthly average population
        ['Total group population', '372', '342', '322', '315', '312', '317', '315', '314', '318', '323', '321', '319'],
      )
    })
  })

  it('guidance box for analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page
      .getChartGuidance('incentive-levels-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by establishment (PGD Region)',
          action: 'opened',
          label: 'MDI',
        }),
      )

    page
      .getChartGuidance('trends-incentive-levels')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level trends (PGD Region)',
          action: 'opened',
          label: 'MDI',
        }),
      )
  })

  it('chart feedback box for analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsIncentiveLevels)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page
      .getChartFeedback('incentive-levels-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by establishment (PGD Region)',
          action: 'opened',
          label: 'MDI',
        }),
      )

    page
      .getChartFeedback('trends-incentive-levels')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level trends (PGD Region)',
          action: 'opened',
          label: 'MDI',
        }),
      )
  })
})
