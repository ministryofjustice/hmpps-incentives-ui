import {
  getTextFromTable,
  testDetailsOpenedGaEvents,
  testInvalidFeedbackSubmission,
  testValidFeedbackSubmission,
} from './utils'
import Page from '../../pages/page'
import HomePage from '../../pages/home'
import AnalyticsIncentiveLevels from '../../pages/analytics/incentiveLevels'
import PgdRegionSelection from '../../pages/analytics/pgdRegionSelection'
import { ChartId } from '../../../server/routes/analyticsChartTypes'

context('Analytics section >  Incentive levels page', () => {
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
        expect(location).to.contain('945')
      })

    getTextFromTable(page.getChartTable('trends-incentive-levels')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_basicRow, standardRow, _enhancedRow, populationRow] = rows
      // remove header column
      standardRow.shift()

      expect(standardRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly average population on standard level
        ['567', '554', '552', '555', '568', '561', '534', '533', '543', '531', '545', '525'],
      )
      expect(populationRow).to.deep.equal(
        // monthly average population
        ['Prison population', '937', '928', '921', '926', '930', '935', '920', '915', '922', '909', '962', '937'],
      )
    })
  })

  it('guidance box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'incentive-levels-by-location': 'How you can use this chart > Incentive level by wing (Prison)',
      'trends-incentive-levels': 'How you can use this chart > Incentive level trends (Prison)',
    }

    testDetailsOpenedGaEvents(AnalyticsIncentiveLevels, 'getChartGuidance', charts)
  })

  it('chart feedback box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'incentive-levels-by-location': 'Is this chart useful > Incentive level by wing (Prison)',
      'trends-incentive-levels': 'Is this chart useful > Incentive level trends (Prison)',
    }

    testDetailsOpenedGaEvents(AnalyticsIncentiveLevels, 'getChartFeedback', charts)
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
        expect(location).to.contain('3,094')
      })

    getTextFromTable(page.getChartTable('trends-incentive-levels')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_basicRow, standardRow, _enhancedRow, populationRow] = rows
      // remove header column
      standardRow.shift()

      expect(standardRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly average population on standard level
        ['1,470', '1,405', '1,388', '1,403', '1,421', '1,427', '1,383', '1,353', '1,360', '1,359', '1,391', '1,331'],
      )
      expect(populationRow).to.deep.equal(
        // monthly average population
        [
          'National population',
          '3,059',
          '3,047',
          '3,036',
          '3,057',
          '3,060',
          '3,066',
          '3,054',
          '3,059',
          '3,063',
          '3,069',
          '3,215',
          '3,100',
        ],
      )
    })
  })

  it('guidance box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'incentive-levels-by-location': 'How you can use this chart > Incentive level by prison group (National)',
      'trends-incentive-levels': 'How you can use this chart > Incentive level trends (National)',
    }

    testDetailsOpenedGaEvents(AnalyticsIncentiveLevels, 'getChartGuidance', charts)
  })

  it('chart feedback box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'incentive-levels-by-location': 'Is this chart useful > Incentive level by prison group (National)',
      'trends-incentive-levels': 'Is this chart useful > Incentive level trends (National)',
    }

    testDetailsOpenedGaEvents(AnalyticsIncentiveLevels, 'getChartFeedback', charts)
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
        expect(location).to.contain('320')
      })

    getTextFromTable(page.getChartTable('trends-incentive-levels')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_basicRow, standardRow, _enhancedRow, populationRow] = rows
      // remove header column
      standardRow.shift()

      expect(standardRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly average population on standard level
        ['100', '92', '95', '96', '98', '103', '104', '112', '106', '101', '98', '92'],
      )
      expect(populationRow).to.deep.equal(
        // monthly average population
        ['Total group population', '322', '315', '312', '317', '315', '314', '318', '323', '321', '319', '330', '320'],
      )
    })
  })

  it('guidance box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'incentive-levels-by-location': 'How you can use this chart > Incentive level by establishment (Group)',
      'trends-incentive-levels': 'How you can use this chart > Incentive level trends (Group)',
    }

    testDetailsOpenedGaEvents(AnalyticsIncentiveLevels, 'getChartGuidance', charts)
  })

  it('chart feedback box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'incentive-levels-by-location': 'Is this chart useful > Incentive level by establishment (Group)',
      'trends-incentive-levels': 'Is this chart useful > Incentive level trends (Group)',
    }

    testDetailsOpenedGaEvents(AnalyticsIncentiveLevels, 'getChartFeedback', charts)
  })
})
