import Page, { type PageElement } from '../page'

export default class PrisonIncentiveLevelAddFormPage extends Page {
  constructor() {
    super('Add a new incentive level')
  }

  get form(): PageElement<HTMLFormElement> {
    return cy.get('#form-prisonIncentiveLevelAddForm')
  }

  get levelCodeRadios(): PageElement<HTMLDivElement> {
    return this.form.find('.govuk-radios__item')
  }

  getInputField(name: string): PageElement<HTMLInputElement> {
    return this.form.find(`[name=${name}]`)
  }
}
