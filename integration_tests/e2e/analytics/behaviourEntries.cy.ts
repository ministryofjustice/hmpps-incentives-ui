import { getTextFromTable, testInvalidFeedbackSubmission, testValidFeedbackSubmission } from './utils'
import Page from '../../pages/page'
import HomePage from '../../pages/home'
import AnalyticsBehaviourEntries from '../../pages/analytics/behaviourEntries'
import AnalyticsIncentiveLevels from '../../pages/analytics/incentiveLevels'
import GoogleAnalyticsSpy from '../../plugins/googleAnalyticsSpy'
import PgdRegionSelection from '../../pages/analytics/pgdRegionSelection'

context('Analytics section > Behaviour entries page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubCreateZendeskTicket')

    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewAnalyticsLink().click()
    const analyticsPage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    analyticsPage.behaviourEntriesNavItem.click()
  })

  it('has feedback banner', () => {
    cy.get('.app-feedback-banner').contains('help us to improve it')
    cy.get('.app-feedback-banner a').invoke('attr', 'href').should('equal', 'https://example.com/analytics-feedback')
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

    page
      .getChartTable('entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('563')
      })

    page
      .getChartTable('prisoners-with-entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('1,164')
      })

    getTextFromTable(page.getChartTable('trends-entries')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [positivesRow, negativesRow, _totalRow, populationRow] = rows
      // remove header column
      positivesRow.shift()
      negativesRow.shift()
      populationRow.shift()

      expect(positivesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly positive entries
        ['194', '173', '191', '205', '155', '209', '160', '254', '176', '170', '131', '205'],
      )
      expect(negativesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly negative entries
        ['248', '243', '267', '310', '295', '322', '307', '277', '333', '353', '318', '374'],
      )
      expect(populationRow).to.deep.equal(
        // monthly average population
        ['917', '932', '937', '928', '921', '926', '930', '935', '920', '915', '922', '909'],
      )
    })
  })

  it('guidance box for analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page
      .getChartGuidance('entries-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Behaviour entries by wing',
          action: 'opened',
          label: 'MDI',
        }),
      )
    page
      .getChartGuidance('entries-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Behaviour entries by wing',
          action: 'closed',
          label: 'MDI',
        }),
      )

    page
      .getChartGuidance('prisoners-with-entries-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Prisoners with behaviour entries by wing',
          action: 'opened',
          label: 'MDI',
        }),
      )
    page
      .getChartGuidance('prisoners-with-entries-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Prisoners with behaviour entries by wing',
          action: 'closed',
          label: 'MDI',
        }),
      )

    page
      .getChartGuidance('trends-entries')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Behaviour entry trends',
          action: 'opened',
          label: 'MDI',
        }),
      )
    page
      .getChartGuidance('trends-entries')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Behaviour entry trends',
          action: 'closed',
          label: 'MDI',
        }),
      )
  })

  it('chart feedback box for analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page
      .getChartFeedback('entries-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Behaviour entries by wing',
          action: 'opened',
          label: 'MDI',
        }),
      )
    page
      .getChartFeedback('entries-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Behaviour entries by wing',
          action: 'closed',
          label: 'MDI',
        }),
      )

    page
      .getChartFeedback('prisoners-with-entries-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Prisoners with behaviour entries by wing',
          action: 'opened',
          label: 'MDI',
        }),
      )
    page
      .getChartFeedback('prisoners-with-entries-by-location')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Prisoners with behaviour entries by wing',
          action: 'closed',
          label: 'MDI',
        }),
      )

    page
      .getChartFeedback('trends-entries')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Behaviour entry trends',
          action: 'opened',
          label: 'MDI',
        }),
      )
    page
      .getChartFeedback('trends-entries')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Behaviour entry trends',
          action: 'closed',
          label: 'MDI',
        }),
      )
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

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.selectPgdRegionLink().click()
    const locationSelectionPage = Page.verifyOnPage(PgdRegionSelection)
    locationSelectionPage.changePgdRegionSelect().select('National')
    locationSelectionPage.continueButton().click()
    const analyticsPage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    analyticsPage.behaviourEntriesNavItem.click()
  })

  it('users see National analytics', () => {
    const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

    page
      .getChartTable('entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('59,811')
      })

    page
      .getChartTable('prisoners-with-entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('89,721')
      })

    getTextFromTable(page.getChartTable('trends-entries')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [positivesRow, negativesRow, _totalRow, populationRow] = rows
      // remove header column
      positivesRow.shift()
      negativesRow.shift()
      populationRow.shift()

      expect(positivesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly positive entries
        ['578', '860', '971', '937', '786', '840', '715', '915', '641', '850', '938', '983'],
      )
      expect(negativesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly negative entries
        ['1,284', '1,528', '1,402', '1,390', '1,367', '1,568', '1,537', '1,387', '1,212', '1,444', '1,395', '1,387'],
      )
      expect(populationRow).to.deep.equal(
        // monthly average population
        ['3,077', '3,070', '3,059', '3,047', '3,036', '3,057', '3,060', '3,066', '3,054', '3,059', '3,064', '3,069'],
      )
    })
  })
})

context('Pgd Region selection > LTHS > Analytics section > Behaviour entries page', () => {
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
    const analyticsPage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    analyticsPage.behaviourEntriesNavItem.click()
  })

  it('users see National analytics', () => {
    const page = Page.verifyOnPage(AnalyticsBehaviourEntries)

    page
      .getChartTable('entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('260')
      })

    page
      .getChartTable('prisoners-with-entries-by-location')
      .first()
      .then(totalsRow => {
        const location = totalsRow.find('td:first-child').text()
        expect(location).to.contain('All')
        expect(location).to.contain('326')
      })

    getTextFromTable(page.getChartTable('trends-entries')).then(rows => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [positivesRow, negativesRow, _totalRow, populationRow] = rows
      // remove header column
      positivesRow.shift()
      negativesRow.shift()
      populationRow.shift()

      expect(positivesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly positive entries
        ['99', '114', '106', '100', '70', '74', '64', '61', '63', '120', '96', '94'],
      )
      expect(negativesRow.map(text => text.split(/\s/)[0])).to.deep.equal(
        // monthly negative entries
        ['169', '169', '170', '176', '168', '190', '200', '291', '200', '186', '171', '206'],
      )
      expect(populationRow).to.deep.equal(
        // monthly average population
        ['372', '342', '322', '315', '312', '317', '315', '314', '318', '323', '321', '319'],
      )
    })
  })
})
