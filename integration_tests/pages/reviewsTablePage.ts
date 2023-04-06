import Page, { PageElement } from './page'

export default class ReviewsTablePage extends Page {
  constructor() {
    super(`Manage incentive reviews`)
  }

  getReviewsTable(): PageElement<HTMLTableRowElement> {
    return cy.get('.govuk-table')
  }

  getIncentiveLevelStandard(): PageElement<HTMLTableRowElement> {
    return cy.get('a[data-ga-action="Standard"]')
  }

  getIncentivesSortedByLastReview(): PageElement<HTMLTableRowElement> {
    return cy.get('th[data-ga-action="by DAYS_SINCE_LAST_REVIEW"]')
  }
}
