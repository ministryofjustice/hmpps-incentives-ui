import Page, { PageElement } from './page'

export default class LocationSelectionPage extends Page {
  constructor() {
    super('View by residential location')
  }

  locationSelect = (): PageElement => cy.get('select[id="changeLocationSelect"]')

  locationSelectOptions = (): PageElement => this.locationSelect().get('option')

  continueButton = (): PageElement => cy.get('button[class="govuk-button"]')
}
