import Page, { type PageElement } from './page'

export default class AnalyticsIndex extends Page {
  constructor() {
    super('Incentives data')
  }

  get cards(): PageElement {
    return cy.get('.card')
  }
}
