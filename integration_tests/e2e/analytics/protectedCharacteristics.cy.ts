import {
  getTextFromTable,
  testDetailsOpenedGaEvents,
  testInvalidFeedbackSubmission,
  testValidFeedbackSubmission,
} from './utils'
import Page from '../../pages/page'
import HomePage from '../../pages/home'
import type AnalyticsPage from '../../pages/analytics'
import AnalyticsIncentiveLevels from '../../pages/analytics/incentiveLevels'
import AnalyticsProtectedCharacteristics from '../../pages/analytics/protectedCharacteristics'
import type { ChartId } from '../../../server/routes/analyticsChartTypes'
import PgdRegionSelection from '../../pages/analytics/pgdRegionSelection'

type TestData = [ChartId, boolean, string[][]][]

const assertTestData = (testData: TestData, page: AnalyticsPage) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const [chartId, removeLastRow, expectedData] of testData) {
    getTextFromTable(page.getChartTable(chartId)).then(rows => {
      const cleanedRows = cleanRows(rows, removeLastRow)
      expect(cleanedRows).to.deep.equal(expectedData)
    })
  }
}

const cleanRows = (rows: string[][], removeLastRow: boolean) => {
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
    cy.task('stubPrisonApiLocations')
    cy.task('stubCreateZendeskTicket')

    cy.signIn()

    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewAnalyticsLink().click()
    const analyticsPage = Page.verifyOnPage(AnalyticsIncentiveLevels)
    analyticsPage.protectedCharacteristicsNavItem.click()
  })

  it('has correct title', () => {
    cy.title().should('eq', 'Manage incentives – Protected characteristics (Age) – Prison')
  })

  it('selector allows user to change protected characteristic', () => {
    cy.get('#characteristic').select('Sexual orientation')
    cy.get('#form-select-characteristic button').click()

    cy.title().should('eq', 'Manage incentives – Protected characteristics (Sexual orientation) – Prison')

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

    const testData: TestData = [
      [
        'population-by-age',
        true,
        [
          ['All', '100%', '945'],
          [''],
          ['18-25', '21%', '203'],
          ['26-35', '30%', '279'],
          ['36-45', '24%', '223'],
          ['46-55', '13%', '123'],
          ['56-65', '6%', '54'],
          ['66+', '7%', '63'],
        ],
      ],
      [
        'incentive-levels-by-age',
        true,
        [
          ['All', '3%', '55%', '42%'],
          [''],
          ['18-25', '6%', '69%', '24%'],
          ['26-35', '3%', '57%', '40%'],
          ['36-45', '2%', '53%', '45%'],
          ['46-55', '2%', '45%', '54%'],
          ['56-65', '0%', '41%', '59%'],
          ['66+', '0%', '40%', '60%'],
        ],
      ],
      [
        'trends-incentive-levels-by-age',
        false,
        [
          ['Basic', '0', '2', '4', '6', '5', '5', '6', '7', '7', '5', '11', '10'],
          ['Standard', '124', '119', '116', '115', '122', '123', '122', '133', '146', '150', '153', '144'],
          ['Enhanced', '31', '27', '26', '24', '22', '27', '28', '30', '34', '37', '45', '49'],
          ['Total', '156', '148', '146', '144', '149', '155', '156', '170', '187', '191', '208', '203'],
        ],
      ],
      [
        'entries-by-age',
        true,
        [
          ['All', '38%', '62%'],
          [''],
          ['18-25', '23%', '77%'],
          ['26-35', '37%', '63%'],
          ['36-45', '61%', '39%'],
          ['46-55', '53%', '47%'],
          ['56-65', '70%', '30%'],
          ['66+', '33%', '67%'],
        ],
      ],
      [
        'trends-entries-by-age',
        false,
        [
          ['Positive', '37', '27', '33', '28', '31', '39', '38', '27', '35', '48', '38', '74'],
          ['Negative', '94', '95', '98', '104', '113', '102', '120', '109', '133', '182', '206', '180'],
          ['All', '131', '122', '131', '132', '144', '141', '158', '136', '168', '230', '244', '254'],
          ['Total', '156', '148', '146', '144', '149', '155', '156', '170', '187', '191', '208', '203'],
        ],
      ],
      [
        'prisoners-with-entries-by-age',
        true,
        [
          ['All', '13%', '16%', '3%', '68%'],
          [''],
          ['18-25', '13%', '33%', '5%', '49%'],
          ['26-35', '15%', '20%', '3%', '61%'],
          ['36-45', '16%', '6%', '4%', '74%'],
          ['46-55', '10%', '9%', '0%', '81%'],
          ['56-65', '13%', '6%', '0%', '81%'],
          ['66+', '2%', '3%', '0%', '95%'],
        ],
      ],
    ]

    assertTestData(testData, page)
  })

  it('guidance box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'incentive-levels-by-age': 'How you can use this chart > Incentive level by age (Prison)',
      'trends-incentive-levels-by-age': 'How you can use this chart > Incentive level by age trends (Prison)',
      'entries-by-age': 'How you can use this chart > Comparison of behaviour entries by age (Prison)',
      'trends-entries-by-age': 'How you can use this chart > Behaviour entries by age trends (Prison)',
      'prisoners-with-entries-by-age': 'How you can use this chart > Behaviour entries by age (Prison)',
    }
    testDetailsOpenedGaEvents(AnalyticsProtectedCharacteristics, 'getChartGuidance', charts)
  })

  it('chart feedback box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'population-by-age': 'Is this chart useful > Population by age (Prison)',
      'incentive-levels-by-age': 'Is this chart useful > Incentive level by age (Prison)',
      'trends-incentive-levels-by-age': 'Is this chart useful > Incentive level by age trends (Prison)',
      'entries-by-age': 'Is this chart useful > Comparison of behaviour entries by age (Prison)',
      'trends-entries-by-age': 'Is this chart useful > Behaviour entries by age trends (Prison)',
      'prisoners-with-entries-by-age': 'Is this chart useful > Behaviour entries by age (Prison)',
    }

    testDetailsOpenedGaEvents(AnalyticsProtectedCharacteristics, 'getChartFeedback', charts)
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
    cy.task('stubPrisonApiLocations')

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
    cy.title().should('eq', 'Manage incentives – Protected characteristics (Age) – National')
  })

  it('selector allows user to change protected characteristic for that pgdRegion', () => {
    cy.get('#characteristic').select('Sexual orientation')
    cy.get('#form-select-characteristic button').click()

    cy.title().should('eq', 'Manage incentives – Protected characteristics (Sexual orientation) – National')

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

    const testData: TestData = [
      [
        'population-by-age',
        true,
        [
          ['All', '100%', '3,094'],
          [''],
          ['15-17', '0%', '0'],
          ['18-25', '18%', '553'],
          ['26-35', '36%', '1,124'],
          ['36-45', '24%', '743'],
          ['46-55', '13%', '416'],
          ['56-65', '5%', '164'],
          ['66+', '3%', '94'],
        ],
      ],
      [
        'incentive-levels-by-age',
        true,
        [
          ['All', '3%', '42%', '55%'],
          [''],
          ['15-17', '0%', '0%', '0%'],
          ['18-25', '6%', '58%', '36%'],
          ['26-35', '3%', '43%', '55%'],
          ['36-45', '1%', '38%', '61%'],
          ['46-55', '1%', '33%', '66%'],
          ['56-65', '1%', '31%', '68%'],
          ['66+', '1%', '34%', '65%'],
        ],
      ],
      [
        'trends-incentive-levels-by-age',
        false,
        [
          ['Basic', '3', '9', '16', '14', '18', '17', '21', '22', '21', '21', '28', '30'],
          ['Standard', '314', '297', '282', '281', '287', '297', '293', '310', '329', '336', '349', '332'],
          ['Enhanced', '153', '152', '152', '153', '149', '152', '153', '155', '164', '177', '191', '194'],
          ['Total', '470', '457', '450', '448', '454', '467', '467', '487', '515', '534', '568', '556'],
        ],
      ],
      [
        'entries-by-age',
        true,
        [
          ['All', '40%', '60%'],
          [''],
          ['15-17', '0%', '0%'],
          ['18-25', '23%', '77%'],
          ['26-35', '39%', '61%'],
          ['36-45', '56%', '44%'],
          ['46-55', '55%', '45%'],
          ['56-65', '65%', '35%'],
          ['66+', '36%', '64%'],
        ],
      ],
      [
        'trends-entries-by-age',
        false,
        [
          ['Positive', '158', '115', '99', '112', '90', '108', '82', '117', '143', '162', '130', '168'],
          ['Negative', '385', '368', '392', '421', '433', '380', '330', '396', '404', '448', '459', '497'],
          ['All', '543', '483', '491', '533', '523', '488', '412', '513', '547', '610', '589', '665'],
          ['Total', '470', '457', '450', '448', '454', '467', '467', '487', '515', '534', '568', '557'],
        ],
      ],
      [
        'prisoners-with-entries-by-age',
        true,
        [
          ['All', '17%', '17%', '3%', '63%'],
          [''],
          ['15-17', '0%', '0%', '0%', '0%'],
          ['18-25', '14%', '33%', '4%', '49%'],
          ['26-35', '18%', '20%', '3%', '58%'],
          ['36-45', '17%', '9%', '3%', '71%'],
          ['46-55', '17%', '10%', '2%', '71%'],
          ['56-65', '16%', '7%', '2%', '74%'],
          ['66+', '4%', '4%', '0%', '91%'],
        ],
      ],
    ]

    assertTestData(testData, page)
  })

  it('guidance box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'incentive-levels-by-age': 'How you can use this chart > Incentive level by age (National)',
      'trends-incentive-levels-by-age': 'How you can use this chart > Incentive level by age trends (National)',
      'entries-by-age': 'How you can use this chart > Comparison of behaviour entries by age (National)',
      'trends-entries-by-age': 'How you can use this chart > Behaviour entries by age trends (National)',
      'prisoners-with-entries-by-age': 'How you can use this chart > Behaviour entries by age (National)',
    }
    testDetailsOpenedGaEvents(AnalyticsProtectedCharacteristics, 'getChartGuidance', charts)
  })

  it('chart feedback box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'population-by-age': 'Is this chart useful > Population by age (National)',
      'incentive-levels-by-age': 'Is this chart useful > Incentive level by age (National)',
      'trends-incentive-levels-by-age': 'Is this chart useful > Incentive level by age trends (National)',
      'entries-by-age': 'Is this chart useful > Comparison of behaviour entries by age (National)',
      'trends-entries-by-age': 'Is this chart useful > Behaviour entries by age trends (National)',
      'prisoners-with-entries-by-age': 'Is this chart useful > Behaviour entries by age (National)',
    }

    testDetailsOpenedGaEvents(AnalyticsProtectedCharacteristics, 'getChartFeedback', charts)
  })
})

context('Pgd Region selection > LTHS > Analytics section > Protected characteristics page', () => {
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
    analyticsPage.protectedCharacteristicsNavItem.click()
  })

  it('has correct title', () => {
    cy.title().should('eq', 'Manage incentives – Protected characteristics (Age) – Long-term and high security')
  })

  it('users see analytics', () => {
    const page = Page.verifyOnPage(AnalyticsProtectedCharacteristics)

    const testData: TestData = [
      [
        'population-by-age',
        true,
        [
          ['All', '100%', '320'],
          [''],
          ['15-17', '0%', '0'],
          ['18-25', '13%', '42'],
          ['26-35', '32%', '103'],
          ['36-45', '26%', '82'],
          ['46-55', '16%', '51'],
          ['56-65', '11%', '35'],
          ['66+', '2%', '7'],
        ],
      ],
      [
        'incentive-levels-by-age',
        true,
        [
          ['All', '3%', '28%', '69%'],
          [''],
          ['15-17', '0%', '0%', '0%'],
          ['18-25', '10%', '45%', '45%'],
          ['26-35', '2%', '34%', '64%'],
          ['36-45', '1%', '26%', '73%'],
          ['46-55', '2%', '18%', '80%'],
          ['56-65', '0%', '17%', '83%'],
          ['66+', '0%', '14%', '86%'],
        ],
      ],
      [
        'trends-incentive-levels-by-age',
        false,
        [
          ['Basic', '1', '1', '1', '1', '1', '0', '3', '3', '3', '3', '3', '4'],
          ['Standard', '27', '23', '20', '20', '21', '24', '21', '24', '24', '22', '21', '19'],
          ['Enhanced', '15', '15', '14', '14', '12', '12', '14', '14', '15', '17', '19', '19'],
          ['Total', '43', '39', '35', '34', '35', '37', '38', '41', '41', '42', '43', '42'],
        ],
      ],
      [
        'entries-by-age',
        true,
        [
          ['All', '38%', '62%'],
          [''],
          ['15-17', '0%', '0%'],
          ['18-25', '19%', '81%'],
          ['26-35', '29%', '71%'],
          ['36-45', '48%', '52%'],
          ['46-55', '48%', '52%'],
          ['56-65', '61%', '39%'],
          ['66+', '100%', '0%'],
        ],
      ],
      [
        'trends-entries-by-age',
        false,
        [
          ['Positive', '27', '12', '5', '3', '2', '4', '5', '22', '20', '25', '12', '16'],
          ['Negative', '68', '53', '69', '49', '47', '63', '38', '55', '39', '57', '71', '48'],
          ['All', '95', '65', '74', '52', '49', '67', '43', '77', '59', '82', '83', '64'],
          ['Total', '43', '39', '35', '34', '35', '37', '38', '41', '41', '42', '43', '42'],
        ],
      ],
      [
        'prisoners-with-entries-by-age',
        true,
        [
          ['All', '18%', '26%', '5%', '51%'],
          [''],
          ['15-17', '0%', '0%', '0%', '0%'],
          ['18-25', '12%', '45%', '10%', '33%'],
          ['26-35', '14%', '36%', '2%', '49%'],
          ['36-45', '22%', '13%', '5%', '60%'],
          ['46-55', '20%', '22%', '6%', '53%'],
          ['56-65', '29%', '17%', '6%', '49%'],
          ['66+', '29%', '0%', '0%', '71%'],
        ],
      ],
    ]

    assertTestData(testData, page)
  })

  it('guidance box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'incentive-levels-by-age': 'How you can use this chart > Incentive level by age (Group)',
      'trends-incentive-levels-by-age': 'How you can use this chart > Incentive level by age trends (Group)',
      'entries-by-age': 'How you can use this chart > Comparison of behaviour entries by age (Group)',
      'trends-entries-by-age': 'How you can use this chart > Behaviour entries by age trends (Group)',
      'prisoners-with-entries-by-age': 'How you can use this chart > Behaviour entries by age (Group)',
    }
    testDetailsOpenedGaEvents(AnalyticsProtectedCharacteristics, 'getChartGuidance', charts)
  })

  it('chart feedback box for analytics is tracked', () => {
    const charts: Partial<Record<ChartId, string>> = {
      'population-by-age': 'Is this chart useful > Population by age (Group)',
      'incentive-levels-by-age': 'Is this chart useful > Incentive level by age (Group)',
      'trends-incentive-levels-by-age': 'Is this chart useful > Incentive level by age trends (Group)',
      'entries-by-age': 'Is this chart useful > Comparison of behaviour entries by age (Group)',
      'trends-entries-by-age': 'Is this chart useful > Behaviour entries by age trends (Group)',
      'prisoners-with-entries-by-age': 'Is this chart useful > Behaviour entries by age (Group)',
    }

    testDetailsOpenedGaEvents(AnalyticsProtectedCharacteristics, 'getChartFeedback', charts)
  })
})
