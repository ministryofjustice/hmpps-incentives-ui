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

  it('has correct title', () => {
    cy.title().should('eq', 'Manage incentives – Protected characteristics – Prison')
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
          ['All', '100%', '929'],
          [''],
          ['18-25', '21%', '197'],
          ['26-35', '31%', '287'],
          ['36-45', '22%', '208'],
          ['46-55', '13%', '118'],
          ['56-65', '6%', '52'],
          ['66+', '7%', '67'],
        ],
      ],
      [
        'incentive-levels-by-age',
        true,
        [
          ['All', '3%', '56%', '41%'],
          [''],
          ['18-25', '6%', '72%', '22%'],
          ['26-35', '3%', '60%', '38%'],
          ['36-45', '1%', '53%', '46%'],
          ['46-55', '2%', '45%', '53%'],
          ['56-65', '2%', '37%', '62%'],
          ['66+', '0%', '40%', '60%'],
        ],
      ],
      [
        'trends-incentive-levels-by-age',
        false,
        [
          ['Basic', '0', '0', '0', '2', '4', '6', '5', '5', '6', '7', '7', '5'],
          ['Standard', '128', '123', '124', '119', '116', '115', '122', '123', '122', '133', '146', '150'],
          ['Enhanced', '28', '30', '31', '27', '26', '24', '22', '27', '28', '30', '34', '37'],
          ['Total', '156', '153', '156', '148', '146', '144', '149', '155', '156', '170', '187', '191'],
        ],
      ],
      [
        'entries-by-age',
        true,
        [
          ['All', '34%', '66%'],
          [''],
          ['18-25', '21%', '79%'],
          ['26-35', '41%', '59%'],
          ['36-45', '46%', '54%'],
          ['46-55', '44%', '56%'],
          ['56-65', '50%', '50%'],
          ['66+', '20%', '80%'],
        ],
      ],
      [
        'trends-entries-by-age',
        false,
        [
          ['Positive', '26', '32', '37', '27', '33', '28', '31', '39', '38', '27', '35', '48'],
          ['Negative', '83', '77', '94', '95', '98', '104', '113', '102', '120', '109', '133', '182'],
          ['All', '109', '109', '131', '122', '131', '132', '144', '141', '158', '136', '168', '230'],
          ['Total', '156', '153', '156', '148', '146', '144', '149', '155', '156', '170', '187', '191'],
        ],
      ],
      [
        'prisoners-with-entries-by-age',
        true,
        [
          ['All', '12%', '19%', '3%', '66%'],
          [''],
          ['18-25', '10%', '35%', '6%', '49%'],
          ['26-35', '18%', '20%', '2%', '60%'],
          ['36-45', '15%', '16%', '4%', '65%'],
          ['46-55', '7%', '8%', '3%', '82%'],
          ['56-65', '8%', '6%', '0%', '87%'],
          ['66+', '1%', '3%', '0%', '96%'],
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

  it('has correct title', () => {
    cy.title().should('eq', 'Manage incentives – Protected characteristics – National')
  })

  it('selector allows user to change protected characteristic for that pgdRegion', () => {
    cy.get('#characteristic').select('Sexual orientation')
    cy.get('#form-select-characteristic button').click()

    cy.get('.govuk-heading-xl').contains('National')
    cy.get('h2.govuk-heading-m').first().contains('Percentage and number of prisoners by sexual orientation')
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
          ['All', '100%', '3,117'],
          [''],
          ['15-17', '0%', '0'],
          ['18-25', '18%', '546'],
          ['26-35', '37%', '1,143'],
          ['36-45', '24%', '747'],
          ['46-55', '14%', '423'],
          ['56-65', '5%', '159'],
          ['66+', '3%', '99'],
        ],
      ],
      [
        'incentive-levels-by-age',
        true,
        [
          ['All', '3%', '43%', '54%'],
          [''],
          ['15-17', '0%', '0%', '0%'],
          ['18-25', '5%', '61%', '34%'],
          ['26-35', '3%', '43%', '54%'],
          ['36-45', '1%', '38%', '61%'],
          ['46-55', '1%', '37%', '62%'],
          ['56-65', '2%', '31%', '67%'],
          ['66+', '0%', '36%', '64%'],
        ],
      ],
      [
        'trends-incentive-levels-by-age',
        false,
        [
          ['Basic', '1', '1', '3', '9', '16', '14', '18', '17', '21', '22', '22', '21'],
          ['Standard', '340', '327', '314', '296', '282', '281', '287', '297', '293', '310', '329', '336'],
          ['Enhanced', '143', '142', '153', '152', '152', '153', '149', '152', '153', '155', '164', '177'],
          ['Total', '484', '469', '470', '457', '450', '448', '454', '467', '467', '487', '515', '534'],
        ],
      ],
      [
        'entries-by-age',
        true,
        [
          ['All', '43%', '57%'],
          [''],
          ['15-17', '0%', '0%'],
          ['18-25', '23%', '77%'],
          ['26-35', '44%', '56%'],
          ['36-45', '53%', '47%'],
          ['46-55', '64%', '36%'],
          ['56-65', '76%', '24%'],
          ['66+', '43%', '57%'],
        ],
      ],
      [
        'trends-entries-by-age',
        false,
        [
          ['Positive', '55', '133', '158', '115', '99', '112', '90', '108', '82', '117', '143', '162'],
          ['Negative', '379', '410', '385', '368', '392', '421', '433', '380', '330', '396', '404', '448'],
          ['All', '434', '543', '543', '483', '491', '533', '523', '488', '412', '513', '547', '610'],
          ['Total', '484', '469', '470', '457', '450', '448', '454', '467', '467', '487', '515', '534'],
        ],
      ],
      [
        'prisoners-with-entries-by-age',
        true,
        [
          ['All', '16%', '16%', '3%', '64%'],
          [''],
          ['15-17', '0%', '0%', '0%', '0%'],
          ['18-25', '11%', '29%', '4%', '55%'],
          ['26-35', '18%', '18%', '4%', '60%'],
          ['36-45', '19%', '13%', '3%', '65%'],
          ['46-55', '15%', '8%', '2%', '75%'],
          ['56-65', '14%', '5%', '1%', '79%'],
          ['66+', '5%', '3%', '0%', '92%'],
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

  it('has correct title', () => {
    cy.title().should('eq', 'Manage incentives – Protected characteristics – Long-term and high security')
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const testData: [ChartId, boolean, string[][]][] = [
      [
        'population-by-age',
        true,
        [
          ['All', '100%', '319'],
          [''],
          ['15-17', '0%', '0'],
          ['18-25', '13%', '41'],
          ['26-35', '32%', '101'],
          ['36-45', '26%', '84'],
          ['46-55', '17%', '53'],
          ['56-65', '10%', '33'],
          ['66+', '2%', '7'],
        ],
      ],
      [
        'incentive-levels-by-age',
        true,
        [
          ['All', '4%', '28%', '68%'],
          [''],
          ['15-17', '0%', '0%', '0%'],
          ['18-25', '7%', '46%', '46%'],
          ['26-35', '5%', '31%', '64%'],
          ['36-45', '2%', '26%', '71%'],
          ['46-55', '4%', '21%', '75%'],
          ['56-65', '0%', '18%', '82%'],
          ['66+', '0%', '14%', '86%'],
        ],
      ],
      [
        'trends-incentive-levels-by-age',
        false,
        [
          ['Basic', '1', '1', '1', '1', '1', '1', '1', '0', '3', '3', '3', '3'],
          ['Standard', '32', '28', '27', '23', '20', '20', '21', '24', '21', '24', '24', '22'],
          ['Enhanced', '16', '16', '15', '15', '14', '14', '12', '12', '14', '14', '15', '17'],
          ['Total', '48', '45', '43', '39', '35', '34', '35', '37', '38', '41', '41', '42'],
        ],
      ],
      [
        'entries-by-age',
        true,
        [
          ['All', '41%', '59%'],
          [''],
          ['15-17', '0%', '0%'],
          ['18-25', '14%', '86%'],
          ['26-35', '38%', '62%'],
          ['36-45', '58%', '42%'],
          ['46-55', '53%', '47%'],
          ['56-65', '80%', '20%'],
          ['66+', '100%', '0%'],
        ],
      ],
      [
        'trends-entries-by-age',
        false,
        [
          ['Positive', '8', '12', '27', '12', '5', '3', '2', '4', '5', '22', '20', '25'],
          ['Negative', '60', '66', '68', '53', '69', '49', '47', '63', '38', '55', '39', '57'],
          ['All', '68', '78', '95', '65', '74', '52', '49', '67', '43', '77', '59', '82'],
          ['Total', '48', '45', '43', '39', '35', '34', '35', '37', '38', '41', '41', '42'],
        ],
      ],
      [
        'prisoners-with-entries-by-age',
        true,
        [
          ['All', '17%', '20%', '3%', '60%'],
          [''],
          ['15-17', '0%', '0%', '0%', '0%'],
          ['18-25', '12%', '51%', '7%', '29%'],
          ['26-35', '16%', '23%', '3%', '58%'],
          ['36-45', '21%', '13%', '4%', '62%'],
          ['46-55', '15%', '17%', '0%', '68%'],
          ['56-65', '15%', '3%', '6%', '76%'],
          ['66+', '14%', '0%', '0%', '86%'],
        ],
      ],
    ]

    assertTestData(testData, page)
  })
})
