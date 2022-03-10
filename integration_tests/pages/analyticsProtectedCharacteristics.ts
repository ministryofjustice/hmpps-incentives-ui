import Page, { type PageElement } from './page'

export default class AnalyticsProtectedCharacteristics extends Page {
  constructor() {
    super('Protected characteristics')
  }

  get incentivesByEthnicity(): PageElement {
    return cy.get('#table-incentive-levels-by-ethnicity tbody tr')
  }

  get incentivesByAgeGroup(): PageElement {
    return cy.get('#table-incentive-levels-by-age-group tbody tr')
  }
}
