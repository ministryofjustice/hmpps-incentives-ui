import Page from '../page'

export default class PrisonerChangeIncentiveLevelDetailsConfirmationPage extends Page {
  constructor() {
    super(`John Smith’s incentive level is set to Basic`)
  }

  get newIncentiveLevel() {
    return cy.get('[data-test="current-incentive-level"]')
  }

  get nextReviewDate() {
    return cy.get('[data-test="next-review-date"]')
  }

  get goToManageIncentives() {
    return cy.get('[data-test="goto-manage-incentives"]')
  }

  get goToPrisonerProfile() {
    return cy.get('[data-test="goto-prisoner-quicklook"]')
  }
}
