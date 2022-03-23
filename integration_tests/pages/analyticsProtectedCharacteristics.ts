import { type PageElement } from './page'
import AnalyticsPage from './analytics'

export default class AnalyticsProtectedCharacteristics extends AnalyticsPage {
  constructor() {
    super('Protected characteristics')
  }

  get incentivesByEthnicity(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-ethnicity tbody tr')
  }

  get incentivesByAgeGroup(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-age-group tbody tr')
  }
}
