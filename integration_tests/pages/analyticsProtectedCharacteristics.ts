import { type PageElement } from './page'
import { AnalyticsPage } from './analytics'

export default class AnalyticsProtectedCharacteristics extends AnalyticsPage {
  constructor() {
    super('Protected characteristics')
  }

  get incentivesByEthnicity(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-ethnicity tbody tr')
  }

  get incentivesByAge(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-age tbody tr')
  }

  get incentivesByReligion(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-religion tbody tr')
  }

  get incentivesByDisability(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-disability tbody tr')
  }

  get incentivesBySexualOrientation(): PageElement<HTMLTableRowElement> {
    return cy.get('#table-incentive-levels-by-sexual-orientation tbody tr')
  }

  get incentivesByEthnicityGuidance(): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes.filter('#guidance-incentive-levels-by-ethnicity').find('.govuk-details__summary')
  }

  get incentivesByAgeGuidance(): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes.filter('#guidance-incentive-levels-by-age').find('.govuk-details__summary')
  }

  get incentivesByReligionGuidance(): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes.filter('#guidance-incentive-levels-by-religion').find('.govuk-details__summary')
  }

  get incentivesByDisabilityGuidance(): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes.filter('#guidance-incentive-levels-by-disability').find('.govuk-details__summary')
  }

  get incentivesBySexualOrientationGuidance(): PageElement<HTMLDetailsElement> {
    return this.chartGuidanceBoxes
      .filter('#guidance-incentive-levels-by-sexual-orientation')
      .find('.govuk-details__summary')
  }

  get incentivesByEthnicityFeedback(): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes
      .filter('#chart-feedback-incentive-levels-by-ethnicity')
      .find('.govuk-details__summary')
  }

  get incentivesByAgeFeedback(): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes.filter('#chart-feedback-incentive-levels-by-age').find('.govuk-details__summary')
  }

  get incentivesByReligionFeedback(): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes
      .filter('#chart-feedback-incentive-levels-by-religion')
      .find('.govuk-details__summary')
  }

  get incentivesByDisabilityFeedback(): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes
      .filter('#chart-feedback-incentive-levels-by-disability')
      .find('.govuk-details__summary')
  }

  get incentivesBySexualOrientationFeedback(): PageElement<HTMLDetailsElement> {
    return this.chartFeedbackBoxes
      .filter('#chart-feedback-incentive-levels-by-sexual-orientation')
      .find('.govuk-details__summary')
  }

  get incentivesByEthnicityFeedbackForm(): PageElement<HTMLFormElement> {
    return cy.get('#form-incentive-levels-by-ethnicity')
  }

  get incentivesByAgeFeedbackForm(): PageElement<HTMLFormElement> {
    return cy.get('#form-incentive-levels-by-age')
  }

  get incentivesByReligionFeedbackForm(): PageElement<HTMLFormElement> {
    return cy.get('#form-incentive-levels-by-religion')
  }

  get incentivesByDisabilityFeedbackForm(): PageElement<HTMLFormElement> {
    return cy.get('#form-incentive-levels-by-disability')
  }

  get incentivesBySexualOrientationFeedbackForm(): PageElement<HTMLFormElement> {
    return cy.get('#form-incentive-levels-by-sexual-orientation')
  }
}
