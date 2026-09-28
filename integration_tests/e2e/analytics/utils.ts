import type { ChartId } from '../../../server/routes/analyticsChartTypes'
import Page, { type PageElement } from '../../pages/page'
import type AnalyticsPage from '../../pages/analytics'

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

export function testChartsGuidanceGaEvents<PageClass extends AnalyticsPage>(
  pageClass: new () => PageClass,
  charts: Partial<Record<ChartId, string>>,
) {
  const page = Page.verifyOnPage(pageClass)
  const detailsGetterMethod = 'getChartGuidance'

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
