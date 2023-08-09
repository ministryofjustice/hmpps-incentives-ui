import {
  getTextFromTable,
  testDetailsOpenedGaEvents,
  testInvalidFeedbackSubmission,
  testValidFeedbackSubmission,
} from './utils'
import Page from '../../pages/page'
import HomePage from '../../pages/home'
import AnalyticsBehaviourEntries from '../../pages/analytics/behaviourEntries'
import AnalyticsIncentiveLevels from '../../pages/analytics/incentiveLevels'
import PgdRegionSelection from '../../pages/analytics/pgdRegionSelection'
import type { ChartId } from '../../../server/routes/analyticsChartTypes'

context('Analytics section > Behaviour entries page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonApiLocations')
    cy.task('stubCreateZendeskTicket')

    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewAnalyticsLink().click()
    const analyticsPage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    analyticsPage.checkLastBreadcrumb('Incentives', '/')
    analyticsPage.behaviourEntriesNavItem.click()
  })

  it('has correct title', () => {
    cy.title().should('eq', 'Incentives – Behaviour entries – Prison')
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

    page
      .getChartTable('entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('509')
      })

    page
      .getChartTable('prisoners-with-entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('1,039')
      })

    getTextFromTable(page.getChartTable('trends-entries')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [positivesRow, negativesRow, _totalRow, populationRow] = rows
      // remove header column
      positivesRow.shift()
      negativesRow.shift()

      expect(positivesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly positive entries
        ['191', '205', '155', '209', '160', '254', '176', '170', '131', '205', '204', '225'],
      )
      expect(negativesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly negative entries
        ['267', '310', '295', '322', '307', '277', '333', '353', '318', '374', '394', '363'],
      )
      expect(populationRow).to.deep.equal(
        // monthly average population
        ['Prison population', '937', '928', '921', '926', '930', '935', '920', '915', '922', '909', '962', '937'],
      )
    })
  })

  it('guidance box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'entries-by-location': 'How you can use this chart > Behaviour entries by wing (Prison)',
      'prisoners-with-entries-by-location':
        'How you can use this chart > Prisoners with behaviour entries by wing (Prison)',
      'trends-entries': 'How you can use this chart > Behaviour entry trends (Prison)',
    }

    testDetailsOpenedGaEvents(AnalyticsBehaviourEntries, 'getChartGuidance', charts)
  })

  it('chart feedback box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'entries-by-location': 'Is this chart useful > Behaviour entries by wing (Prison)',
      'prisoners-with-entries-by-location': 'Is this chart useful > Prisoners with behaviour entries by wing (Prison)',
      'trends-entries': 'Is this chart useful > Behaviour entry trends (Prison)',
    }

    testDetailsOpenedGaEvents(AnalyticsBehaviourEntries, 'getChartFeedback', charts)
  })

  it('users can submit feedback on charts', () => {
    testValidFeedbackSubmission(AnalyticsBehaviourEntries, [
      'entries-by-location',
      'prisoners-with-entries-by-location',
      'trends-entries',
    ])
  })

  it('users will see errors if they submit invalid feedback on chart', () => {
    testInvalidFeedbackSubmission(AnalyticsBehaviourEntries, [
      'entries-by-location',
      'prisoners-with-entries-by-location',
      'trends-entries',
    ])
  })
})

context('Pgd Region selection > National > Analytics section > Behaviour entries page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonApiLocations')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.selectPgdRegionLink().click()
    const locationSelectionPage = Page.verifyOnPage(PgdRegionSelection)
    locationSelectionPage.changePgdRegionSelect().select('National')
    locationSelectionPage.continueButton().click()
    const analyticsPage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    analyticsPage.checkLastBreadcrumb('Incentives', '/')
    analyticsPage.behaviourEntriesNavItem.click()
  })

  it('has correct title', () => {
    cy.title().should('eq', 'Incentives – Behaviour entries – National')
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

    page
      .getChartTable('entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('60,269')
      })

    page
      .getChartTable('prisoners-with-entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('87,307')
      })

    getTextFromTable(page.getChartTable('trends-entries')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [positivesRow, negativesRow, _totalRow, populationRow] = rows
      // remove header column
      positivesRow.shift()
      negativesRow.shift()

      expect(positivesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly positive entries
        ['971', '937', '786', '840', '715', '915', '641', '850', '938', '983', '1,008', '930'],
      )
      expect(negativesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly negative entries
        ['1,402', '1,390', '1,367', '1,568', '1,537', '1,387', '1,212', '1,444', '1,396', '1,389', '1,339', '1,369'],
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
      'entries-by-location': 'How you can use this chart > Behaviour entries by prison group (National)',
      'prisoners-with-entries-by-location':
        'How you can use this chart > Prisoners with behaviour entries by prison group (National)',
      'trends-entries': 'How you can use this chart > Behaviour entry trends (National)',
    }

    testDetailsOpenedGaEvents(AnalyticsBehaviourEntries, 'getChartGuidance', charts)
  })

  it('chart feedback box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'entries-by-location': 'Is this chart useful > Behaviour entries by prison group (National)',
      'prisoners-with-entries-by-location':
        'Is this chart useful > Prisoners with behaviour entries by prison group (National)',
      'trends-entries': 'Is this chart useful > Behaviour entry trends (National)',
    }

    testDetailsOpenedGaEvents(AnalyticsBehaviourEntries, 'getChartFeedback', charts)
  })
})

context('Pgd Region selection > LTHS > Analytics section > Behaviour entries page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonApiLocations')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.selectPgdRegionLink().click()
    const locationSelectionPage = Page.verifyOnPage(PgdRegionSelection)
    locationSelectionPage.changePgdRegionSelect().select('LTHS')
    locationSelectionPage.continueButton().click()
    const analyticsPage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    analyticsPage.checkLastBreadcrumb('Incentives', '/')
    analyticsPage.behaviourEntriesNavItem.click()
  })

  it('has correct title', () => {
    cy.title().should('eq', 'Incentives – Behaviour entries – Long-term and high security')
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

    page
      .getChartTable('entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('306')
      })

    page
      .getChartTable('prisoners-with-entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('8,818')
      })

    getTextFromTable(page.getChartTable('trends-entries')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [positivesRow, negativesRow, _totalRow, populationRow] = rows
      // remove header column
      positivesRow.shift()
      negativesRow.shift()

      expect(positivesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly positive entries
        ['106', '100', '70', '74', '64', '61', '63', '120', '96', '94', '140', '126'],
      )
      expect(negativesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly negative entries
        ['170', '176', '168', '190', '200', '291', '200', '186', '171', '206', '198', '153'],
      )
      expect(populationRow).to.deep.equal(
        // monthly average population
        ['Total group population', '322', '315', '312', '317', '315', '314', '318', '323', '321', '319', '330', '320'],
      )
    })
  })

  it('guidance box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'entries-by-location': 'How you can use this chart > Behaviour entries by establishment (Group)',
      'prisoners-with-entries-by-location':
        'How you can use this chart > Prisoners with behaviour entries by establishment (Group)',
      'trends-entries': 'How you can use this chart > Behaviour entry trends (Group)',
    }

    testDetailsOpenedGaEvents(AnalyticsBehaviourEntries, 'getChartGuidance', charts)
  })

  it('chart feedback box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'entries-by-location': 'Is this chart useful > Behaviour entries by establishment (Group)',
      'prisoners-with-entries-by-location':
        'Is this chart useful > Prisoners with behaviour entries by establishment (Group)',
      'trends-entries': 'Is this chart useful > Behaviour entry trends (Group)',
    }

    testDetailsOpenedGaEvents(AnalyticsBehaviourEntries, 'getChartFeedback', charts)
  })
})
