import Page, { type PageElement } from '../page'

export default class PrisonIncentiveLevelNextAddFormPage extends Page {
  constructor(private readonly levelName: string = 'Standard') {
    super(`Add ${levelName}`)
  }

  get form(): PageElement<HTMLFormElement> {
    // NB: reuses same form as PrisonIncentiveLevelAddFormPage
    return cy.get('#form-prisonIncentiveLevelAddForm')
  }

  getInputField(name: string): PageElement<HTMLInputElement> {
    return this.form.find(`[name=${name}]`)
  }
}
