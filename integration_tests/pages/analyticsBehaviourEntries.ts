import { type PageElement } from './page'
import { AnalyticsPage } from './analytics'

export default class AnalyticsBehaviourEntries extends AnalyticsPage {
  constructor() {
    super('Behaviour entries')
  }

  get entriesByLocation(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-entries-by-location tbody tr')
  }

  get prisonersWithEntriesByLocation(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-prisoners-with-entries-by-location tbody tr')
  }

  get entriesTrends(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-trends-entries tbody tr')
  }
}
