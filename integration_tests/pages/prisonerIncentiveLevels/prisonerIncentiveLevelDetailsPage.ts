import Page, { type PageElement } from '../page'

export default class PrisonerIncentiveLevelDetailsPage extends Page {
  constructor() {
    super('Incentive level details')
  }

  get recordIncentiveLevelButton(): PageElement<HTMLAnchorElement> {
    return cy.get('[data-test="change-incentive-level-link"] a')
  }

  get nextReviewDate() {
    return cy.get('[data-test="next-review-date"]')
  }

  get nextReviewOverdue() {
    return cy.get('[data-test="next-review-overdue"]')
  }

  get incentiveLevelHistoryTable() {
    return cy.get('[data-test="incentive-level-history"]')
  }

  get establishmentSelect() {
    return cy.get('[data-test="establishment-select"]')
  }

  get incentiveLevelSelect() {
    return cy.get('[data-test="incentive-level-select"]')
  }

  get filterSubmit() {
    return cy.get('[data-test="filter-submit"]')
  }

  get noIncentiveLevelHistory() {
    return cy.get('[data-test="no-incentive-level-history-message"]')
  }

  get fromDate(): PageElement<HTMLElement> {
    return cy.get('#fromDate')
  }
}
