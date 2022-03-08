import Page, { type PageElement } from './page'

export default class AnalyticsBehaviourEntries extends Page {
  constructor() {
    super('Behaviour entries in the last 28 days')
  }

  get entriesByLocation(): PageElement {
    return cy.get('#table-entries-by-location tbody tr')
  }

  get prisonersWithEntriesByLocation(): PageElement {
    return cy.get('#table-prisoners-with-entries-by-location tbody tr')
  }
}
