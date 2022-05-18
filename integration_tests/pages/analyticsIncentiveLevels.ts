import { PageElement } from './page'
import { AnalyticsPage } from './analytics'

export default class AnalyticsIncentiveLevels extends AnalyticsPage {
  constructor() {
    super('Incentive levels')
  }

  get incentivesByLocation(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-location tbody tr')
  }

  get incentivesTrends(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-trends-incentive-levels tbody tr')
  }
}
