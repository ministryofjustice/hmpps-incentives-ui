import Page, { type PageElement } from './page'

export default class AnalyticsIndex extends Page {
  constructor() {
    super('See incentives data')
  }

  get cards(): PageElement {
    return cy.get('.card')
  }
}
