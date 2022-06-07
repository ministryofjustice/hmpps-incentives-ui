import Page, { type PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Manage incentives')
  }

  viewIncentivesLevelsLink = (): PageElement => cy.get('[data-test="incentive-information"] a')

  viewAnalyticsLink = (): PageElement => cy.get('[data-test="incentive-analytics"] a')

  selectPrisonGroupLink = (): PageElement => cy.get('[data-test="select-prison-group"] a')
}
