import Page, { type PageElement } from '../page'

export default class IncentiveLevelCreateFormPage extends Page {
  constructor() {
    super('Create a new incentive level')
  }

  get form(): PageElement<HTMLFormElement> {
    return cy.get('#form-incentiveLevelCreateForm')
  }

  getInputField(name: string): PageElement<HTMLInputElement> {
    return this.form.find(`[name=${name}]`)
  }
}
