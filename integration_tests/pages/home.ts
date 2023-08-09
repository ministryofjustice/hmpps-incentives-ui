import Page, { type PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Incentives')
  }

  viewIncentivesLevelsLink = (): PageElement<HTMLAnchorElement> => cy.get('[data-test="incentive-information"] a')

  viewAnalyticsLink = (): PageElement<HTMLAnchorElement> => cy.get('[data-test="incentive-analytics"] a')

  selectPgdRegionLink = (): PageElement<HTMLAnchorElement> => cy.get('[data-test="select-pgd-region"] a')

  aboutNationalPolicyLink = (): PageElement<HTMLAnchorElement> => cy.get('[data-test="about-national-policy"] a')

  aboutAnalyticsPageLink = (): PageElement<HTMLAnchorElement> => cy.get('[data-test="about-data"] a')

  manageIncentiveLevelsLink = (): PageElement<HTMLAnchorElement> => cy.get('[data-test="manage-incentive-levels"] a')

  managePrisonIncentiveLevelsLink = (): PageElement<HTMLAnchorElement> =>
    cy.get('[data-test="manage-prison-incentive-levels"] a')

  get cards(): PageElement<HTMLDivElement> {
    return cy.get('.dps-card')
  }
}
