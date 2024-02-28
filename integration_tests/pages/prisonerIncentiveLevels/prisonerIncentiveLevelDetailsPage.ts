import Page, { type PageElement } from '../page'

export default class PrisonerIncentiveLevelDetailsPage extends Page {
  constructor() {
    super('John Smith’s incentive details')
  }

  get recordIncentiveLevelButton(): PageElement<HTMLAnchorElement> {
    return cy.get('[data-test="change-incentive-level-link"] a')
  }

  get nextReviewDate(): PageElement<HTMLParagraphElement> {
    return cy.get('[data-test="next-review-date"]')
  }

  get nextReviewOverdue(): PageElement<HTMLSpanElement> {
    return cy.get('[data-test="next-review-overdue"]')
  }

  get incentiveLevelHistoryTable(): PageElement<HTMLTableElement> {
    return cy.get('[data-test="incentive-level-history"]')
  }

  get establishmentSelect(): PageElement<HTMLSelectElement> {
    return cy.get('[data-test="establishment-select"]')
  }

  get incentiveLevelSelect(): PageElement<HTMLSelectElement> {
    return cy.get('[data-test="incentive-level-select"]')
  }

  get filterSubmit(): PageElement<HTMLButtonElement> {
    return cy.get('[data-test="filter-submit"]')
  }

  get clearFilter(): PageElement<HTMLAnchorElement> {
    return cy.get('#clearFilter')
  }

  get noIncentiveLevelHistory(): PageElement<HTMLParagraphElement> {
    return cy.get('[data-test="no-incentive-level-history-message"]')
  }

  get fromDate(): PageElement<HTMLInputElement> {
    return cy.get('[data-qa="fromDate"]')
  }
}
