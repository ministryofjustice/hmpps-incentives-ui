import Page, { PageElement } from '../page'

export default class PrisonerChangeIncentiveLevelDetailsConfirmationPage extends Page {
  constructor() {
    super(`John Smith’s incentive level is set to Basic`)
  }

  get newIncentiveLevel(): PageElement {
    return cy.get('[data-test="current-incentive-level"]')
  }

  get nextReviewDate(): PageElement {
    return cy.get('[data-test="next-review-date"]')
  }

  get goToManageIncentives(): PageElement<HTMLAnchorElement> {
    return cy.get('[data-test="goto-manage-incentives"]')
  }

  get goToPrisonerProfile(): PageElement<HTMLAnchorElement> {
    return cy.get('[data-test="goto-prisoner-quicklook"]')
  }
}
