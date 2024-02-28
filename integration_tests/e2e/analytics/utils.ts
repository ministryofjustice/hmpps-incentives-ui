import type { ChartId } from '../../../server/routes/analyticsChartTypes'
import Page, { type PageElement } from '../../pages/page'
import type AnalyticsPage from '../../pages/analytics'

export function testValidFeedbackSubmission<PageClass extends AnalyticsPage>(
  pageClass: new () => PageClass,
  chartIds: ChartId[],
) {
  chartIds.forEach(chartId => {
    let page = Page.verifyOnPage(pageClass)

    // open feedback box and select "yes"
    page.getChartFeedback(chartId).click()
    page.getChartFeedbackForm(chartId).find('[name=chartUseful][value=yes] + label').click()
    page.getChartFeedbackForm(chartId).submit()

    // should remain on the same page with a success message and no error summary
    page = Page.verifyOnPage(pageClass)
    page.messages.spread((...$divs) => {
      expect($divs).to.have.lengthOf(1)
      expect($divs[0]).to.contain('Your feedback has been submitted')
    })
    page.errorSummary.should('not.exist')
  })
}

export function testInvalidFeedbackSubmission<PageClass extends AnalyticsPage>(
  pageClass: new () => PageClass,
  chartIds: ChartId[],
) {
  chartIds.forEach(chartId => {
    let page = Page.verifyOnPage(pageClass)

    // open feedback box and select "no", typing some comments
    page.getChartFeedback(chartId).click()
    page.getChartFeedbackForm(chartId).find('[name=chartUseful][value=no] + label').click()
    page.getChartFeedbackForm(chartId).find('[name=noComments]').type('I’m confused')
    page.getChartFeedbackForm(chartId).submit()

    // should remain on the same page
    page = Page.verifyOnPage(pageClass)

    // error summary should have 1 error message
    page.messages.should('not.exist')
    page.errorSummaryTitle.contains('There is a problem')
    page.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Select a reason for your answer')
    })
    // feedback box should be open already
    page.getChartFeedback(chartId).parent().should('have.attr', 'open')
    // "no" should already be checked
    page.getChartFeedbackForm(chartId).find('[name=chartUseful][value=no]').should('have.attr', 'checked')
    // typed comments should still be there
    page.getChartFeedbackForm(chartId).find('[name=noComments]').should('have.value', 'I’m confused')
    // same error message should show
    page.getChartFeedbackForm(chartId).find('p.govuk-error-message').contains('Select a reason for your answer')
  })
}

export function getTextFromTable(chainable: PageElement<HTMLTableRowElement>): Cypress.Chainable<string[][]> {
  return chainable.then(rows => {
    const rowsAndValues = rows
      .map((_, row) => {
        const rowValues: string[] = []
        for (let index = 0; index < row.children.length; index += 1) {
          rowValues.push(row.children[index]?.textContent?.trim())
        }
        return { rowValues }
      })
      .toArray()
    return cy.wrap(rowsAndValues.map(({ rowValues }) => rowValues))
  })
}

export function testDetailsOpenedGaEvents<PageClass extends AnalyticsPage>(
  pageClass: new () => PageClass,
  detailsGetterMethod: 'getChartGuidance' | 'getChartFeedback',
  charts: Partial<Record<ChartId, string>>,
) {
  const page = Page.verifyOnPage(pageClass)

  cy.trackGoogleAnalyticsCalls().then(googleAnalyticsTracker => {
    for (const [chartId, gaCategory] of Object.entries(charts)) {
      page[detailsGetterMethod]
        .call(page, chartId)
        .click()
        .then(() =>
          googleAnalyticsTracker.shouldHaveLastSent('event', 'incentives_event', {
            category: gaCategory,
            action: 'opened',
            label: 'MDI',
          }),
        )
    }
  })
}
