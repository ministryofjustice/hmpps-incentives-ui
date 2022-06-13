import Page, { type PageElement } from '../page'

export default class PgdRegionSelection extends Page {
  constructor() {
    super('Select a view')
  }

  changePgdRegionSelect = (): PageElement => cy.get('select[id="changePgdRegionSelect"]')

  continueButton = (): PageElement => cy.get('button[class="govuk-button"]')
}
