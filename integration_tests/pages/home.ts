import Page, { PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Manage incentives')
  }

  viewIncentivesLevelsLink = (): PageElement => cy.get('[data-test="incentive-information"] a')
}
