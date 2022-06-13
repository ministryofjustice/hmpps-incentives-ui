import Page, { type PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Manage incentives')
  }

  viewIncentivesLevelsLink = (): PageElement => cy.get('[data-test="incentive-information"] a')

  viewAnalyticsLink = (): PageElement => cy.get('[data-test="incentive-analytics"] a')

  selectPgdRegionLink = (): PageElement => cy.get('[data-test="select-pgd-region"] a')
}
