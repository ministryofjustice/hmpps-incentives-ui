import Page, { type PageElement } from './page'

export default abstract class AnalyticsPage extends Page {
  get subNavigation(): PageElement<HTMLUListElement> {
    return cy.get('.moj-sub-navigation__list')
  }

  get behaviourEntriesNavItem(): PageElement<HTMLAnchorElement> {
    return this.subNavigation.find('[data-qa=behaviour-entries]')
  }

  get incentiveLevelsNavItem(): PageElement<HTMLAnchorElement> {
    return this.subNavigation.find('[data-qa=incentive-levels]')
  }

  get protectedCharacteristicsNavItem(): PageElement<HTMLAnchorElement> {
    return this.subNavigation.find('[data-qa=protected-characteristics]')
  }
}
