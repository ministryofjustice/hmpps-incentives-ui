import Page, { PageElement } from './page'

// eslint-disable-next-line import/prefer-default-export
export abstract class AnalyticsPage extends Page {
  get subNavigation(): PageElement<HTMLUListElement> {
    return cy.get('.moj-sub-navigation__list')
  }

  get behaviourEntriesNavItem(): PageElement<HTMLAnchorElement> {
    return this.subNavigation.find('[data-qa=behaviour-entries]')
  }

  get incentiveLevelsNavItem(): PageElement<HTMLAnchorElement> {
    return this.subNavigation.find('[data-qa=incentive-levels]')
  }

  get protectedCharacteristicsNavItem(): PageElement<HTMLAnchorElement> {
    return this.subNavigation.find('[data-qa=protected-characteristics]')
  }

  get messages(): PageElement<HTMLDivElement> {
    return cy.get('.moj-banner')
  }

  get errorSummary(): PageElement<HTMLDivElement> {
    return cy.get('.govuk-error-summary')
  }

  get errorSummaryTitle(): PageElement<HTMLHeadingElement> {
    return this.errorSummary.find('.govuk-error-summary__title')
  }

  get errorSummaryItems(): PageElement<HTMLLIElement> {
    return this.errorSummary.find('.govuk-error-summary__list li')
  }

  get chartGuidanceBoxes(): PageElement<HTMLDetailsElement> {
    return cy.get('.govuk-details[data-qa=guidance]')
  }

  get chartFeedbackBoxes(): PageElement<HTMLDetailsElement> {
    return cy.get('.govuk-details[data-qa=chart-feedback]')
  }

  getGraphGuidance(graphId: string): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes.filter(`#guidance-${graphId}`).find('.govuk-details__summary')
  }

  getGraphFeedback(graphId: string): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes.filter(`#chart-feedback-${graphId}`).find('.govuk-details__summary')
  }

  getGraphFeedbackForm(graphId: string): PageElement<HTMLDetailsElement> {
    return cy.get(`#form-${graphId}`)
  }
}
