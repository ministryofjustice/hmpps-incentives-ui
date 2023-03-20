import Page, { type PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Manage incentives')
  }

  viewIncentivesLevelsLink = (): PageElement<HTMLAnchorElement> => cy.get('[data-test="incentive-information"] a')

  viewAnalyticsLink = (): PageElement<HTMLAnchorElement> => cy.get('[data-test="incentive-analytics"] a')

  selectPgdRegionLink = (): PageElement<HTMLAnchorElement> => cy.get('[data-test="select-pgd-region"] a')

  aboutAnalyticsPageLink = (): PageElement<HTMLAnchorElement> => cy.get('[data-test="about-data"] a')

  get cards(): PageElement<HTMLDivElement> {
    return cy.get('.card')
  }
}
