export type PageElement<TElement = HTMLElement> = Cypress.Chainable<JQuery<TElement>>

export default abstract class Page {
  static verifyOnPage<T extends Page>(constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    return new constructor(...args)
  }

  constructor(protected readonly title: string) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  get headerUserName(): PageElement<HTMLSpanElement> {
    return cy.get('[data-qa=header-user-name]')
  }

  get signOut(): PageElement<HTMLAnchorElement> {
    return cy.get('[data-qa=signOut]')
  }

  get breadcrumbs(): PageElement<HTMLDivElement> {
    return cy.get('.govuk-breadcrumbs__list-item')
  }

  checkLastBreadcrumb(label: string, href: string): void {
    this.breadcrumbs.last().should('contain.text', label)
    this.breadcrumbs.last().find('a').should('have.attr', 'href', href)
  }

  get messages(): PageElement<HTMLDivElement> {
    return cy.get('.moj-banner')
  }

  get errorSummary(): PageElement<HTMLDivElement> {
    return cy.get('.govuk-error-summary')
  }

  get errorSummaryTitle(): PageElement<HTMLHeadingElement> {
    return this.errorSummary.find('.govuk-error-summary__title')
  }

  get errorSummaryItems(): PageElement<HTMLLIElement> {
    return this.errorSummary.find('.govuk-error-summary__list li')
  }

  get fallbackHeaderUserName(): PageElement<HTMLLIElement> {
    return cy.get('[data-qa=header-user-name]')
  }

  get fallbackFooter(): PageElement {
    return cy.get('.govuk-footer')
  }
}
