import type { ChartId } from '../../../server/routes/analyticsChartTypes'
import Page, { type PageElement } from '../page'

export default abstract class AnalyticsPage extends Page {
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

  get chartGuidanceBoxes(): PageElement<HTMLDetailsElement> {
    return cy.get('.govuk-details[data-qa=guidance]')
  }

  get chartFeedbackBoxes(): PageElement<HTMLDetailsElement> {
    return cy.get('.govuk-details[data-qa=chart-feedback]')
  }

  getChartGuidance(chartId: ChartId): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes.filter(`#guidance-${chartId}`).find('.govuk-details__summary')
  }

  getChartFeedback(chartId: ChartId): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes.filter(`#chart-feedback-${chartId}`).find('.govuk-details__summary')
  }

  getChartFeedbackForm(chartId: ChartId): PageElement<HTMLFormElement> {
    return cy.get(`#form-${chartId}`)
  }

  getChartTable(chartId: ChartId): PageElement<HTMLTableRowElement> {
    return cy.get(`#table-${chartId} tbody tr`)
  }
}
