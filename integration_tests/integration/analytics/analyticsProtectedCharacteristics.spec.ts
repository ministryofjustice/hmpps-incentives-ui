import { getTextFromTable, testInvalidFeedbackSubmission, testValidFeedbackSubmission } from './utils'
import Page from '../../pages/page'
import HomePage from '../../pages/home'
import AnalyticsIncentiveLevels from '../../pages/analyticsIncentiveLevels'
import AnalyticsProtectedCharacteristics from '../../pages/analyticsProtectedCharacteristics'
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
