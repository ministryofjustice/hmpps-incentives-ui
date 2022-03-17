import Page, { type PageElement } from './page'

export default class AnalyticsIndex extends Page {
  constructor() {
    super('Incentives data')
  }

  get cards(): PageElement {
    return cy.get('.card')
  }

  get behaviourEntriesCard(): PageElement {
    return cy.get('[data-test="behaviour-entries"]')
  }

  get incentiveLevelsCard(): PageElement {
    return cy.get('[data-test="incentive-levels"]')
  }

  get protectedCharacteristicsCard(): PageElement {
    return cy.get('[data-test="protected-characteristics"]')
  }
}
