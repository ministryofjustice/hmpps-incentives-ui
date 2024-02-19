import Page from '../page'

export default class PrisonerChangeIncentiveLevelDetailsPage extends Page {
  constructor() {
    super(`Record`)
  }

  get pageHeading() {
    return cy.get('h1')
  }

  get currentIncentiveLevel() {
    return cy.get('[data-test="current-incentive-level"]')
  }

  get newLevel() {
    return cy.get('[data-test="new-level"]')
  }

  get submitChange() {
    return cy.get('[data-test="submit-change"]')
  }

  get formErrors() {
    return cy.get('[data-test="form-errors"]')
  }

  get newLevelError() {
    return cy.get('#newIepLevel-error')
  }

  get reasonError() {
    return cy.get('#reason-error')
  }

  get changeReason() {
    return cy.get('[data-test="change-reason"]')
  }

  get radioButton() {
    return cy.get(`label[for="newIepLevel"]`)
  }
}
