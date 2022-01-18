import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'
import AuthManageDetailsPage from '../pages/authManageDetails'
import LocationSelectionPage from '../pages/locationSelection'

context('SignIn', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonApiLocations')
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in header', () => {
    cy.signIn()
    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)
    locationSelectionPage.headerUserName().should('contain.text', 'J. Smith')
  })

  it('User can log out', () => {
    cy.signIn()
    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)
    locationSelectionPage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User can manage their details', () => {
    cy.signIn()
    const locationSelectionPage = Page.verifyOnPage(LocationSelectionPage)

    locationSelectionPage.manageDetails().get('a').invoke('removeAttr', 'target')
    locationSelectionPage.manageDetails().click()
    Page.verifyOnPage(AuthManageDetailsPage)
  })
})
