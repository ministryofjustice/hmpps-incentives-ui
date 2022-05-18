import { type PageElement } from './page'
import { AnalyticsPage } from './analytics'

export default class AnalyticsProtectedCharacteristics extends AnalyticsPage {
  constructor() {
    super('Protected characteristics')
  }

  get populationByAge(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-population-by-age tbody tr')
  }

  get incentivesByAge(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-age tbody tr')
  }

  get entriesByAge(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-entries-by-age tbody tr')
  }
}
