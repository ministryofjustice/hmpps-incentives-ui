import { getTextFromTable, testInvalidFeedbackSubmission, testValidFeedbackSubmission } from './utils'
import Page from '../../pages/page'
import HomePage from '../../pages/home'
import AnalyticsIncentiveLevels from '../../pages/analytics/incentiveLevels'
import AnalyticsProtectedCharacteristics from '../../pages/analytics/protectedCharacteristics'
import GoogleAnalyticsSpy from '../../plugins/googleAnalyticsSpy'

context('Analytics section > Protected characteristics page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubCreateZendeskTicket')

    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewAnalyticsLink().click()
    const analyticsPage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    analyticsPage.protectedCharacteristicsNavItem.click()
  })

  it('has feedback banner', () => {
    cy.get('.app-feedback-banner').contains('help us to improve it')
    cy.get('.app-feedback-banner a').invoke('attr', 'href').should('equal', 'https://example.com/analytics-feedback')
  })

  it('selector allows user to change protected characteristic', () => {
    cy.get('#characteristic').select('Sexual orientation')
    cy.get('#form-select-characteristic button').click()

    cy.get('h2.govuk-heading-m')
      .first()
      .contains('Percentage and number of prisoners in the establishment by sexual orientation')
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const cleanRows = (rows: string[][]) => {
      return rows.map(row => {
        row.pop() // remove last column as it's empty
        return row.map(cell => cell.split(/\s/)[0])
      })
    }

    getTextFromTable(page.getChartTable('population-by-age')).then(rows => {
      const cleanedRows = cleanRows(rows)
      expect(cleanedRows).to.deep.equal([
        ['All', '100%', '921'],
        [''],
        ['18-25', '21%', '189'],
        ['26-35', '32%', '297'],
        ['36-45', '23%', '212'],
        ['46-55', '12%', '108'],
        ['56-65', '6%', '52'],
        ['66+', '7%', '63'],
      ])
    })

    getTextFromTable(page.getChartTable('incentive-levels-by-age')).then(rows => {
      const cleanedRows = cleanRows(rows)
      expect(cleanedRows).to.deep.equal([
        ['All', '2%', '58%', '40%'],
        [''],
        ['18-25', '3%', '78%', '19%'],
        ['26-35', '2%', '61%', '37%'],
        ['36-45', '2%', '56%', '42%'],
        ['46-55', '0%', '45%', '55%'],
        ['56-65', '2%', '33%', '65%'],
        ['66+', '0%', '37%', '63%'],
      ])
    })

    getTextFromTable(page.getChartTable('trends-incentive-levels-by-age')).then(rows => {
      const cleanedRows = cleanRows(rows)
      expect(cleanedRows).to.deep.equal([
        ['Basic', '1', '0', '0', '0', '2', '4', '6', '5', '5', '6', '7'],
        ['Standard', '130', '128', '123', '124', '119', '116', '115', '122', '123', '122', '133'],
        ['Enhanced', '30', '28', '30', '31', '27', '26', '24', '22', '27', '28', '30'],
        ['Total', '162', '156', '153', '156', '148', '146', '144', '149', '155', '156', '170'],
      ])
    })

    getTextFromTable(page.getChartTable('trends-entries-by-age')).then(rows => {
      const cleanedRows = cleanRows(rows)
      expect(cleanedRows).to.deep.equal([
        ['Positive', '35', '26', '32', '37', '27', '33', '28', '31', '39', '38', '27'],
        ['Negative', '113', '83', '77', '94', '95', '98', '104', '113', '102', '120', '109'],
        ['All', '148', '109', '109', '131', '122', '131', '132', '144', '141', '158', '136'],
        ['Total', '162', '156', '153', '156', '148', '146', '144', '149', '155', '156', '170'],
      ])
    })

    getTextFromTable(page.getChartTable('entries-by-age')).then(rows => {
      const cleanedRows = cleanRows(rows)
      expect(cleanedRows).to.deep.equal([
        ['All', '11%', '17%', '2%', '69%'],
        [''],
        ['18-25', '14%', '30%', '2%', '54%'],
        ['26-35', '13%', '18%', '3%', '66%'],
        ['36-45', '12%', '17%', '2%', '68%'],
        ['46-55', '8%', '8%', '2%', '81%'],
        ['56-65', '6%', '2%', '0%', '92%'],
        ['66+', '0%', '5%', '0%', '95%'],
      ])
    })
  })

  it('guidance box for analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    page
      .getChartGuidance('incentive-levels-by-age')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by age',
          action: 'opened',
          label: 'MDI',
        })
      )
    page
      .getChartGuidance('incentive-levels-by-age')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Incentive level by age',
          action: 'closed',
          label: 'MDI',
        })
      )

    page
      .getChartGuidance('entries-by-age')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'How you can use this chart > Behaviour entries by age',
          action: 'opened',
          label: 'MDI',
        })
      )
    page
      .getChartGuidance('entries-by-age')
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
      .getChartFeedback('population-by-age')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Population by age',
          action: 'opened',
          label: 'MDI',
        })
      )
    page
      .getChartFeedback('population-by-age')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Population by age',
          action: 'closed',
          label: 'MDI',
        })
      )

    page
      .getChartFeedback('incentive-levels-by-age')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by age',
          action: 'opened',
          label: 'MDI',
        })
      )
    page
      .getChartFeedback('incentive-levels-by-age')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Incentive level by age',
          action: 'closed',
          label: 'MDI',
        })
      )

    page
      .getChartFeedback('entries-by-age')
      .click()
      .then(() =>
        gaSpy.shouldHaveSentEvent('incentives_event', {
          category: 'Is this chart useful > Behaviour entries by age',
          action: 'opened',
          label: 'MDI',
        })
      )
    page
      .getChartFeedback('entries-by-age')
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
