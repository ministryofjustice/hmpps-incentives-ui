import Page from '../pages/page'
import HomePage from '../pages/home'
import LocationSelectionPage from '../pages/locationSelection'
import ReviewsTablePage from '../pages/reviewsTablePage'

context('Manage incentives (select a location)', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubGetAvailableLevels')
    cy.task('stubPrisonApiImages')
    cy.task('stubPrisonApiLocations')
    cy.task('stubGetIncentivesLevelBasic')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewIncentivesLevelsLink().click()
  })

  it(' has correct title', () => {
    cy.title().should('eq', 'Manage incentives – Select a location')
  })

  it('user sees correct locations for their active case load', () => {
    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)
    locationSelectionPage.locationSelectOptions().should('contain.text', 'Houseblock 2')
    locationSelectionPage.locationSelectOptions().should('contain.text', 'Houseblock 42')
  })

  it('user selects location by clicking continue ', () => {
    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)
    locationSelectionPage.locationSelect().select('Houseblock 42')
    locationSelectionPage.continueButton().click()
    cy.title().should('contain', 'Manage incentive reviews')
  })
})

// should direct user to the manage incentive reviews page
context('Manage incentive reviews', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubGetAvailableLevels')
    cy.task('stubPrisonApiLocations')
    cy.task('stubGetIncentivesLevelBasic')
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewIncentivesLevelsLink().click()
    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)
    locationSelectionPage.locationSelect().select('Houseblock 42')
    locationSelectionPage.continueButton().click()
  })

  it('has correct title', () => {
    cy.title().should('eq', 'Manage incentives – Manage incentive reviews')
  })

  it('has feedback banner', () => {
    cy.get('.app-feedback-banner').contains('help us to improve it')
    cy.get('.app-feedback-banner a').invoke('attr', 'href').should('equal', 'https://example.com/table-feedback')
  })

  it('users will see selected location or select alternative ', () => {
    // cy.get('.govuk-main-wrapper').contains((text) => {
    //   return text.includes('Houseblock 42') || text.includes('Select another location');
    // })
    cy.get('.govuk-main-wrapper').contains('Houseblock 42')
  })

  it('has reviews table ', () => {
    const page = Page.verifyOnPage(ReviewsTablePage)
    page
      .getReviewsTable()
      .first()
      .then(table => {
        const rowTitles = table.find('td:first-child').text()
        expect(rowTitles).to.contain('\n ')
      })
    page.getPrisonerName().should('contain.text', 'Saunders, John')
  })

  it('users can visit standard tab', () => {
    const page = Page.verifyOnPage(ReviewsTablePage)
    cy.task('stubGetIncentivesLevelStandard')
    page.getIncentiveLevelStandard().click()
    page.getIncentiveLevelStandard().should('contain.text', 'Standard')
  })

  it('users can sort by a different header', () => {
    const page = Page.verifyOnPage(ReviewsTablePage)
    cy.task('stubGetIncentivesSorted')
    page.getIncentivesSortedByLastReview().find('a').click()
    page.getIncentivesSortedByLastReview().should('have.attr', 'aria-sort', 'ascending')
  })
})
