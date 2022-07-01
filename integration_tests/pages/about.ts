import Page, { type PageElement } from './page'

export default class AboutPage extends Page {
  constructor() {
    super('About')
  }

  get feedbackForm(): PageElement<HTMLFormElement> {
    return cy.get('#form-about-page-feedback')
  }
}
