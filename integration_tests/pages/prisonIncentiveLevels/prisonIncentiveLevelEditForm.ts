import Page, { type PageElement } from '../page'

export default class PrisonIncentiveLevelEditFormPage extends Page {
  constructor(private readonly levelName: string = 'Standard') {
    super(`Change settings for ${levelName}`)
  }

  get form(): PageElement<HTMLFormElement> {
    return cy.get('#form-prisonIncentiveLevelEditForm')
  }

  getInputField(name: string): PageElement<HTMLInputElement> {
    return this.form.find(`[name=${name}]`)
  }
}
