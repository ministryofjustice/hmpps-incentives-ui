import { type PageElement } from './page'
import AnalyticsPage from './analytics'

export default class AnalyticsIncentiveLevels extends AnalyticsPage {
  constructor() {
    super('Incentive levels')
  }

  get incentivesByLocation(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-location tbody tr')
  }

  get incentivesByLocationGuidance(): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes.filter('#guidance-incentive-levels-by-location').find('.govuk-details__summary')
  }

  get incentivesByLocationFeedback(): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes
      .filter('#chart-feedback-incentive-levels-by-location')
      .find('.govuk-details__summary')
  }
}
