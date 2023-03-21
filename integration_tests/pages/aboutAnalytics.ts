import Page, { type PageElement } from './page'

export default class AboutAnalyticsPage extends Page {
  constructor() {
    super('About')
  }

  get feedbackForm(): PageElement<HTMLFormElement> {
    return cy.get('#form-about-page-feedback')
  }
}
