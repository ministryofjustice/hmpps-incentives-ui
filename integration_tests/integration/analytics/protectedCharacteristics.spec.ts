import { getTextFromTable, testInvalidFeedbackSubmission, testValidFeedbackSubmission } from './utils'
import Page from '../../pages/page'
import HomePage from '../../pages/home'
import AnalyticsIncentiveLevels from '../../pages/analytics/incentiveLevels'
import AnalyticsProtectedCharacteristics from '../../pages/analytics/protectedCharacteristics'
import GoogleAnalyticsSpy from '../../plugins/googleAnalyticsSpy'
import { ChartId } from '../../../server/routes/analyticsChartTypes'
import PrisonGroupSelection from '../../pages/analytics/prisonGroupSelection'

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

  it('PC groups dropdowns are working and they are independent', () => {
    // Change group for incentive level trends chart
    cy.get('#trendsIncentiveLevelsGroup').select('26-35')
    cy.get('#form-select-trendsIncentiveLevelsGroup button').click()

    // Check incentive level trends chart updated...
    cy.get('#table-trends-incentive-levels-by-age').contains('Total 26-35 population')
    // ...but other entries trends chart did not change
    cy.get('#table-trends-entries-by-age').contains('Total 18-25 population')

    // Change group for entries trends chart
    cy.get('#trendsEntriesGroup').select('66+')
    cy.get('#form-select-trendsEntriesGroup button').click()

    // Check entries trends chart updated...
    cy.get('#table-trends-entries-by-age').contains('Total 66+ population')
    // ...but other incentive level trends chart did not change
    cy.get('#table-trends-incentive-levels-by-age').contains('Total 26-35 population')
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const cleanRows = (rows: string[][], removeLastRow) => {
      return rows.map(row => {
        if (removeLastRow) {
          row.pop() // remove last column as it's empty
        }
        return row.map(cell => cell.split(/\s/)[0])
      })
    }

    const testData: [ChartId, boolean, string[][]][] = [
      [
        'population-by-age',
        true,
        [
          ['All', '100%', '923'],
          [''],
          ['18-25', '22%', '202'],
          ['26-35', '31%', '285'],
          ['36-45', '22%', '204'],
          ['46-55', '13%', '117'],
          ['56-65', '5%', '48'],
          ['66+', '7%', '67'],
        ],
      ],
      [
        'incentive-levels-by-age',
        true,
        [
          ['All', '2%', '57%', '40%'],
          [''],
          ['18-25', '5%', '74%', '20%'],
          ['26-35', '2%', '62%', '35%'],
          ['36-45', '2%', '52%', '46%'],
          ['46-55', '1%', '44%', '56%'],
          ['56-65', '0%', '35%', '65%'],
          ['66+', '0%', '40%', '60%'],
        ],
      ],
      [
        'trends-incentive-levels-by-age',
        false,
        [
          ['Basic', '1', '0', '0', '0', '2', '4', '6', '5', '5', '6', '7', '7'],
          ['Standard', '130', '128', '123', '124', '119', '116', '115', '122', '123', '122', '133', '146'],
          ['Enhanced', '30', '28', '30', '31', '27', '26', '24', '22', '27', '28', '30', '34'],
          ['Total', '162', '156', '153', '156', '148', '146', '144', '149', '155', '156', '170', '187'],
        ],
      ],
      [
        'entries-by-age',
        true,
        [
          ['All', '36%', '64%'],
          [''],
          ['18-25', '23%', '77%'],
          ['26-35', '39%', '61%'],
          ['36-45', '47%', '53%'],
          ['46-55', '63%', '38%'],
          ['56-65', '71%', '29%'],
          ['66+', '67%', '33%'],
        ],
      ],
      [
        'trends-entries-by-age',
        false,
        [
          ['Positive', '35', '26', '32', '37', '27', '33', '28', '31', '39', '38', '27', '35'],
          ['Negative', '113', '83', '77', '94', '95', '98', '104', '113', '102', '120', '109', '133'],
          ['All', '148', '109', '109', '131', '122', '131', '132', '144', '141', '158', '136', '168'],
          ['Total', '162', '156', '153', '156', '148', '146', '144', '149', '155', '156', '170', '187'],
        ],
      ],
      [
        'prisoners-with-entries-by-age',
        true,
        [
          ['All', '15%', '18%', '3%', '65%'],
          [''],
          ['18-25', '16%', '34%', '4%', '45%'],
          ['26-35', '16%', '18%', '2%', '63%'],
          ['36-45', '17%', '14%', '3%', '66%'],
          ['46-55', '11%', '7%', '2%', '80%'],
          ['56-65', '8%', '4%', '0%', '88%'],
          ['66+', '6%', '3%', '0%', '91%'],
        ],
      ],
    ]

    // eslint-disable-next-line no-restricted-syntax
    for (const [chartId, removeLastRow, expectedData] of testData) {
      getTextFromTable(page.getChartTable(chartId)).then(rows => {
        const cleanedRows = cleanRows(rows, removeLastRow)
        expect(cleanedRows).to.deep.equal(expectedData)
      })
    }
  })

  it('guidance box for analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    const guidanceBoxes: [ChartId, string][] = [
      ['incentive-levels-by-age', 'How you can use this chart > Incentive level by age'],
      ['trends-incentive-levels-by-age', 'How you can use this chart > Incentive level by age trends'],
      ['entries-by-age', 'How you can use this chart > Comparison of behaviour entries by age'],
      ['trends-entries-by-age', 'How you can use this chart > Behaviour entries by age trends'],
      ['prisoners-with-entries-by-age', 'How you can use this chart > Behaviour entries by age'],
    ]

    // eslint-disable-next-line no-restricted-syntax
    for (const [chartId, expectedCategory] of guidanceBoxes) {
      page
        .getChartGuidance(chartId)
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: expectedCategory,
            action: 'opened',
            label: 'MDI',
          }),
        )
      page
        .getChartGuidance(chartId)
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: expectedCategory,
            action: 'closed',
            label: 'MDI',
          }),
        )
    }
  })

  it('chart feedback box for analytics is tracked', () => {
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const gaSpy = new GoogleAnalyticsSpy()
    gaSpy.install()

    const feedbackBoxes: [ChartId, string][] = [
      ['population-by-age', 'Is this chart useful > Population by age'],
      ['incentive-levels-by-age', 'Is this chart useful > Incentive level by age'],
      ['trends-incentive-levels-by-age', 'Is this chart useful > Incentive level by age trends'],
      ['entries-by-age', 'Is this chart useful > Comparison of behaviour entries by age'],
      ['trends-entries-by-age', 'Is this chart useful > Behaviour entries by age trends'],
      ['prisoners-with-entries-by-age', 'Is this chart useful > Behaviour entries by age'],
    ]

    // eslint-disable-next-line no-restricted-syntax
    for (const [chartId, expectedCategory] of feedbackBoxes) {
      page
        .getChartFeedback(chartId)
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: expectedCategory,
            action: 'opened',
            label: 'MDI',
          }),
        )
      page
        .getChartFeedback(chartId)
        .click()
        .then(() =>
          gaSpy.shouldHaveSentEvent('incentives_event', {
            category: expectedCategory,
            action: 'closed',
            label: 'MDI',
          }),
        )
    }
  })

  it('users can submit feedback on charts', () => {
    testValidFeedbackSubmission(AnalyticsProtectedCharacteristics, [
      'population-by-age',
      'incentive-levels-by-age',
      'trends-incentive-levels-by-age',
      'entries-by-age',
      'trends-entries-by-age',
      'prisoners-with-entries-by-age',
    ])
  })

  it('users will see errors if they submit invalid feedback on chart', () => {
    testInvalidFeedbackSubmission(AnalyticsProtectedCharacteristics, [
      'population-by-age',
      'incentive-levels-by-age',
      'trends-incentive-levels-by-age',
      'entries-by-age',
      'trends-entries-by-age',
      'prisoners-with-entries-by-age',
    ])
  })
})

context('Prison Group selection > Analytics section > Protected characteristics page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.selectPrisonGroupLink().click()
    const locationSelectionPage = Page.verifyOnPage(PrisonGroupSelection)
    locationSelectionPage.changePrisonGroupSelect().select('National')
    locationSelectionPage.continueButton().click()
    const analyticsPage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    analyticsPage.protectedCharacteristicsNavItem.click()
  })

  it('selector allows user to change protected characteristic for that prison group', () => {
    cy.get('#characteristic').select('Sexual orientation')
    cy.get('#form-select-characteristic button').click()

    cy.get('.govuk-heading-xl').contains('National')
    cy.get('h2.govuk-heading-m')
      .first()
      .contains('Percentage and number of prisoners in the establishment by sexual orientation')
  })

  it('PC groups dropdowns are working for that prison group', () => {
    // Change group for incentive level trends chart
    cy.get('#trendsIncentiveLevelsGroup').select('26-35')
    cy.get('#form-select-trendsIncentiveLevelsGroup button').click()

    // Still on National page
    cy.get('.govuk-heading-xl').contains('National')

    // Change group for entries trends chart
    cy.get('#trendsEntriesGroup').select('66+')
    cy.get('#form-select-trendsEntriesGroup button').click()

    // Still on National page
    cy.get('.govuk-heading-xl').contains('National')
  })
})
