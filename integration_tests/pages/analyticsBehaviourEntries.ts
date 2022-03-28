import { type PageElement } from './page'
import AnalyticsPage from './analytics'

export default class AnalyticsBehaviourEntries extends AnalyticsPage {
  constructor() {
    super('Behaviour entries in the last 28 days')
  }

  get entriesByLocation(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-entries-by-location tbody tr')
  }

  get prisonersWithEntriesByLocation(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-prisoners-with-entries-by-location tbody tr')
  }

  get entriesByLocationGuidance(): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes.filter('#guidance-entries-by-location').find('.govuk-details__summary')
  }

  get prisonersWithEntriesByLocationGuidance(): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes
      .filter('#guidance-prisoners-with-entries-by-location')
      .find('.govuk-details__summary')
  }

  get entriesByLocationFeedback(): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes.filter('#chart-feedback-entries-by-location').find('.govuk-details__summary')
  }

  get prisonersWithEntriesByLocationFeedback(): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes
      .filter('#chart-feedback-prisoners-with-entries-by-location')
      .find('.govuk-details__summary')
  }

  get entriesByLocationFeedbackForm(): PageElement<HTMLFormElement> {
    return cy.get('#form-entries-by-location')
  }

  get prisonersWithEntriesByLocationFeedbackForm(): PageElement<HTMLFormElement> {
    return cy.get('#form-prisoners-with-entries-by-location')
  }
}
