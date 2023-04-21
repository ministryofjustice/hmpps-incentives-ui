import Page, { type PageElement } from '../page'

export default class PrisonIncentiveLevelDeactivateFormPage extends Page {
  constructor() {
    super('Remove an incentive level')
  }

  checkLastBreadcrumb() {
    this.breadcrumbs.last().should('contain.text', this.title)
  }

  get form(): PageElement<HTMLFormElement> {
    return cy.get('#form-prisonIncentiveLevelDeactivateForm')
  }

  get confirmationRadios(): PageElement<HTMLDivElement> {
    return this.form.find('.govuk-radios__item')
  }
}
