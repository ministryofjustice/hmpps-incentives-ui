import Page, { type PageElement } from '../page'

export default class IncentiveLevelStatusFormPage extends Page {
  constructor() {
    super('Select incentive level status')
  }

  get form(): PageElement<HTMLFormElement> {
    return cy.get('#form-incentiveLevelStatusForm')
  }

  get statusRadios(): PageElement<HTMLDivElement> {
    return this.form.find('.govuk-radios__item')
  }
}
