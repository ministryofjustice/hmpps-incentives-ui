import Page from '../pages/page'
import LocationSelectionPage from '../pages/locationSelection'
import BehaviourEntriesPage from '../pages/behaviourEntriesPage'

context('Location selection', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonApiImages')
    cy.task('stubPrisonApiLocations')
    cy.task('stubIncentivesApiGetLocationSummary')
  })

  it('user sees correct locations for their active case load', () => {
    cy.signIn()
    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)
    locationSelectionPage.locationSelectOptions().should('contain.text', 'Houseblock 2')
    locationSelectionPage.locationSelectOptions().should('contain.text', 'Houseblock 42')
  })

  it('user can select one of the locations', () => {
    cy.signIn()
    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)

    locationSelectionPage.locationSelect().select('MDI-42')
    locationSelectionPage.continueButton().click()

    Page.verifyOnPage(BehaviourEntriesPage)
    cy.get('h1').contains('Houseblock 42')
  })
})
