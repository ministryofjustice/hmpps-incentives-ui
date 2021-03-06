import Page from '../pages/page'
import HomePage from '../pages/home'
import LocationSelectionPage from '../pages/locationSelection'
import BehaviourEntriesPage from '../pages/behaviourEntriesPage'

context('Location selection', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiImages')
    cy.task('stubPrisonApiLocations')
    cy.task('stubIncentivesApiGetLocationSummary')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.viewIncentivesLevelsLink().click()
  })

  it('user sees correct locations for their active case load', () => {
    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)
    locationSelectionPage.locationSelectOptions().should('contain.text', 'Houseblock 2')
    locationSelectionPage.locationSelectOptions().should('contain.text', 'Houseblock 42')
  })

  it('user can select one of the locations', () => {
    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)
    locationSelectionPage.locationSelect().select('MDI-42')
    locationSelectionPage.continueButton().click()

    Page.verifyOnPage(BehaviourEntriesPage)
    cy.get('p').contains('Houseblock 42')
  })
})
