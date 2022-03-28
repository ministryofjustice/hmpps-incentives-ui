import { type PageElement } from './page'
import AnalyticsPage from './analytics'

export default class AnalyticsProtectedCharacteristics extends AnalyticsPage {
  constructor() {
    super('Protected characteristics')
  }

  get incentivesByEthnicity(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-ethnicity tbody tr')
  }

  get incentivesByAgeGroup(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-age-group tbody tr')
  }

  get incentivesByEthnicityGuidance(): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes.filter('#guidance-incentive-levels-by-ethnicity').find('.govuk-details__summary')
  }

  get incentivesByAgeGroupGuidance(): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes.filter('#guidance-incentive-levels-by-age-group').find('.govuk-details__summary')
  }

  get incentivesByEthnicityFeedback(): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes
      .filter('#chart-feedback-incentive-levels-by-ethnicity')
      .find('.govuk-details__summary')
  }

  get incentivesByAgeGroupFeedback(): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes
      .filter('#chart-feedback-incentive-levels-by-age-group')
      .find('.govuk-details__summary')
  }

  get incentivesByEthnicityFeedbackForm(): PageElement<HTMLFormElement> {
    return cy.get('#form-incentive-levels-by-ethnicity')
  }

  get incentivesByAgeGroupFeedbackForm(): PageElement<HTMLFormElement> {
    return cy.get('#form-incentive-levels-by-age-group')
  }
}
