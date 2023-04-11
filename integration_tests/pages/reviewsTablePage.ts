import Page, { type PageElement } from './page'

export default class ReviewsTablePage extends Page {
  constructor() {
    super(`Manage incentive reviews`)
  }

  getReviewsTable(): PageElement<HTMLTableElement> {
    return cy.get('.govuk-table')
  }

  getIncentiveLevelStandard(): PageElement<HTMLAnchorElement> {
    return cy.get('a[data-ga-action="Standard"]')
  }

  getIncentivesSortedByLastReview(): PageElement<HTMLTableCellElement> {
    return cy.get('th[data-ga-action="by DAYS_SINCE_LAST_REVIEW"]')
  }

  getPrisonerName(): PageElement<HTMLTableCellElement> {
    return cy.get('a[data-ga-action="prisoner name"]')
  }
}
