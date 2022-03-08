import Page, { type PageElement } from './page'

export default class AnalyticsIncentiveLevels extends Page {
  constructor() {
    super('Incentive levels')
  }

  get incentivesByLocation(): PageElement {
    return cy.get('#table-incentive-levels-by-location tbody tr')
  }
}
