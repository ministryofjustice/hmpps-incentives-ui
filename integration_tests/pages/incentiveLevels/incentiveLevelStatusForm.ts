import Page, { type PageElement } from '../page'

export default class IncentiveLevelStatusFormPage extends Page {
  constructor() {
    super('Select incentive level status')
  }

  checkLastBreadcrumb() {
    this.breadcrumbs.last().should('contain.text', this.title)
  }

  get form(): PageElement<HTMLFormElement> {
    return cy.get('#form-incentiveLevelStatusForm')
  }

  get statusRadios(): PageElement<HTMLDivElement> {
    return this.form.find('.govuk-radios__item')
  }
}
