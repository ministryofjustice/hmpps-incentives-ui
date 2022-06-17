import { getTextFromTable, testInvalidFeedbackSubmission, testValidFeedbackSubmission } from './utils'
import Page from '../../pages/page'
import HomePage from '../../pages/home'
import AnalyticsIncentiveLevels from '../../pages/analytics/incentiveLevels'
import AnalyticsProtectedCharacteristics from '../../pages/analytics/protectedCharacteristics'
import GoogleAnalyticsSpy from '../../plugins/googleAnalyticsSpy'
import { ChartId } from '../../../server/routes/analyticsChartTypes'
import PgdRegionSelection from '../../pages/analytics/pgdRegionSelection'

const assertTestData = (testData, page) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const [chartId, removeLastRow, expectedData] of testData) {
    getTextFromTable(page.getChartTable(chartId)).then(rows => {
      const cleanedRows = cleanRows(rows, removeLastRow)
      expect(cleanedRows).to.deep.equal(expectedData)
    })
  }
}

const cleanRows = (rows: string[][], removeLastRow) => {
  return rows.map(row => {
    if (removeLastRow) {
      row.pop() // remove last column as it's empty
    }
    return row.map(cell => cell.split(/\s/)[0])
  })
}

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

    assertTestData(testData, page)
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

context('Pgd Region selection > National > Analytics section > Protected characteristics page', () => {
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
    analyticsPage.protectedCharacteristicsNavItem.click()
  })

  it('selector allows user to change protected characteristic for that pgdRegion', () => {
    cy.get('#characteristic').select('Sexual orientation')
    cy.get('#form-select-characteristic button').click()

    cy.get('.govuk-heading-xl').contains('National')
    cy.get('h2.govuk-heading-m')
      .first()
      .contains('Percentage and number of prisoners in the establishment by sexual orientation')
  })

  it('PC groups dropdowns are working for that pgdRegion', () => {
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

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const testData: [ChartId, boolean, string[][]][] = [
      [
        'population-by-age',
        true,
        [
          ['All', '100%', '3,095'],
          [''],
          ['15-17', '0%', '0'],
          ['18-25', '18%', '546'],
          ['26-35', '36%', '1,127'],
          ['36-45', '24%', '752'],
          ['46-55', '13%', '410'],
          ['56-65', '5%', '160'],
          ['66+', '3%', '100'],
        ],
      ],
      [
        'incentive-levels-by-age',
        true,
        [
          ['All', '3%', '43%', '54%'],
          [''],
          ['15-17', '0%', '0%', '0%'],
          ['18-25', '6%', '61%', '33%'],
          ['26-35', '4%', '43%', '54%'],
          ['36-45', '2%', '36%', '61%'],
          ['46-55', '1%', '37%', '62%'],
          ['56-65', '0%', '31%', '69%'],
          ['66+', '1%', '37%', '62%'],
        ],
      ],
      [
        'trends-incentive-levels-by-age',
        false,
        [
          ['Basic', '3', '1', '1', '3', '9', '16', '14', '18', '17', '21', '22', '22'],
          ['Standard', '348', '340', '327', '314', '297', '282', '281', '287', '297', '293', '310', '329'],
          ['Enhanced', '142', '143', '142', '153', '152', '152', '153', '149', '152', '153', '155', '164'],
          ['Total', '492', '484', '469', '470', '457', '450', '448', '454', '467', '467', '487', '515'],
        ],
      ],
      [
        'entries-by-age',
        true,
        [
          ['All', '42%', '58%'],
          [''],
          ['15-17', '0%', '0%'],
          ['18-25', '27%', '73%'],
          ['26-35', '42%', '58%'],
          ['36-45', '53%', '47%'],
          ['46-55', '57%', '43%'],
          ['56-65', '78%', '22%'],
          ['66+', '32%', '68%'],
        ],
      ],
      [
        'trends-entries-by-age',
        false,
        [
          ['Positive', '83', '55', '133', '158', '115', '99', '112', '90', '108', '82', '117', '143'],
          ['Negative', '388', '379', '410', '385', '368', '392', '421', '433', '380', '330', '395', '390'],
          ['All', '471', '434', '543', '543', '483', '491', '533', '523', '488', '412', '512', '533'],
          ['Total', '492', '484', '469', '470', '457', '450', '448', '454', '467', '467', '487', '515'],
        ],
      ],
      [
        'prisoners-with-entries-by-age',
        true,
        [
          ['All', '17%', '17%', '4%', '62%'],
          [''],
          ['15-17', '0%', '0%', '0%', '0%'],
          ['18-25', '16%', '30%', '6%', '48%'],
          ['26-35', '18%', '19%', '5%', '58%'],
          ['36-45', '20%', '13%', '3%', '64%'],
          ['46-55', '16%', '9%', '2%', '73%'],
          ['56-65', '12%', '4%', '1%', '83%'],
          ['66+', '6%', '3%', '0%', '91%'],
        ],
      ],
    ]

    assertTestData(testData, page)
  })
})

context('Pgd Region selection > LTHS > Analytics section > Protected characteristics page', () => {
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
    analyticsPage.protectedCharacteristicsNavItem.click()
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const testData: [ChartId, boolean, string[][]][] = [
      [
        'population-by-age',
        true,
        [
          ['All', '100%', '318'],
          [''],
          ['15-17', '0%', '0'],
          ['18-25', '13%', '42'],
          ['26-35', '31%', '99'],
          ['36-45', '26%', '84'],
          ['46-55', '16%', '52'],
          ['56-65', '11%', '34'],
          ['66+', '2%', '7'],
        ],
      ],
      [
        'incentive-levels-by-age',
        true,
        [
          ['All', '3%', '31%', '66%'],
          [''],
          ['15-17', '0%', '0%', '0%'],
          ['18-25', '5%', '55%', '40%'],
          ['26-35', '2%', '36%', '62%'],
          ['36-45', '5%', '23%', '73%'],
          ['46-55', '2%', '25%', '73%'],
          ['56-65', '0%', '18%', '82%'],
          ['66+', '0%', '14%', '86%'],
        ],
      ],
      [
        'trends-incentive-levels-by-age',
        false,
        [
          ['Basic', '2', '1', '1', '1', '1', '1', '1', '1', '0', '3', '3', '3'],
          ['Standard', '35', '32', '28', '27', '23', '20', '20', '21', '24', '21', '24', '24'],
          ['Enhanced', '12', '16', '16', '15', '15', '14', '14', '12', '12', '14', '14', '15'],
          ['Total', '49', '48', '45', '43', '39', '35', '34', '35', '37', '38', '41', '41'],
        ],
      ],
      [
        'entries-by-age',
        true,
        [
          ['All', '32%', '68%'],
          [''],
          ['15-17', '0%', '0%'],
          ['18-25', '22%', '78%'],
          ['26-35', '29%', '71%'],
          ['36-45', '41%', '59%'],
          ['46-55', '31%', '69%'],
          ['56-65', '82%', '18%'],
          ['66+', '0%', '0%'],
        ],
      ],
      [
        'trends-entries-by-age',
        false,
        [
          ['Positive', '14', '8', '12', '27', '12', '5', '3', '2', '4', '5', '22', '20'],
          ['Negative', '66', '60', '66', '68', '53', '69', '49', '47', '63', '38', '55', '39'],
          ['All', '80', '68', '78', '95', '65', '74', '52', '49', '67', '43', '77', '59'],
          ['Total', '49', '48', '45', '43', '39', '35', '34', '35', '37', '38', '41', '41'],
        ],
      ],
      [
        'prisoners-with-entries-by-age',
        true,
        [
          ['All', '14%', '22%', '5%', '60%'],
          [''],
          ['15-17', '0%', '0%', '0%', '0%'],
          ['18-25', '14%', '45%', '14%', '26%'],
          ['26-35', '9%', '28%', '6%', '57%'],
          ['36-45', '20%', '17%', '4%', '60%'],
          ['46-55', '12%', '13%', '0%', '75%'],
          ['56-65', '15%', '3%', '3%', '79%'],
          ['66+', '0%', '0%', '0%', '100%'],
        ],
      ],
    ]

    assertTestData(testData, page)
  })
})
