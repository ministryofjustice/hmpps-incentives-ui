import Page, { type PageElement } from '../page'

export default class PrisonGroupSelection extends Page {
  constructor() {
    super('Select a view')
  }

  changePrisonGroupSelect = (): PageElement => cy.get('select[id="changePrisonGroupSelect"]')

  continueButton = (): PageElement => cy.get('button[class="govuk-button"]')
}
