import Page, { type PageElement } from '../page'

export default class PrisonerChangeIncentiveLevelDetailsPage extends Page {
  constructor(possessiveName: string = 'John Smith’s') {
    super(`Record ${possessiveName} incentive level`)
  }

  get currentIncentiveLevel(): PageElement<HTMLParagraphElement> {
    return cy.get('[data-test="current-incentive-level"]')
  }

  get newLevel(): PageElement<HTMLDivElement> {
    return cy.get('[data-test="new-level"]')
  }

  get submitChange(): PageElement<HTMLButtonElement> {
    return cy.get('[data-test="submit-change"]')
  }

  get newLevelError(): PageElement<HTMLParagraphElement> {
    return cy.get('#newIepLevel-error')
  }

  get reasonError(): PageElement<HTMLParagraphElement> {
    return cy.get('#reason-error')
  }

  get changeReason(): PageElement<HTMLTextAreaElement> {
    return cy.get('[data-test="change-reason"]')
  }

  get radioButton(): PageElement<HTMLInputElement> {
    return cy.get('label[for="newIepLevel"]')
  }
}
