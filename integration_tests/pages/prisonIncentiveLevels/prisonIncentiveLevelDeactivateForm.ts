import Page, { type PageElement } from '../page'

export default class PrisonIncentiveLevelDeactivateFormPage extends Page {
  constructor(private readonly levelName: string = 'Standard') {
    super(`Are you sure you want to remove ${levelName}?`)
  }

  checkLastBreadcrumb() {
    this.breadcrumbs.last().should('contain.text', `Are you sure you want to remove ${this.levelName}?`)
  }

  get form(): PageElement<HTMLFormElement> {
    return cy.get('#form-prisonIncentiveLevelDeactivateForm')
  }

  get confirmationRadios(): PageElement<HTMLDivElement> {
    return this.form.find('.govuk-radios__item')
  }
}
