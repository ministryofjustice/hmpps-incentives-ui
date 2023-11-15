import Page from '../pages/page'
import AuthSignInPage from '../pages/authSignIn'
import HomePage from '../pages/home'

context('Sign in', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiLocations')
    cy.task('stubDpsComponentsFail')
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Unauthenticated user navigating to sign in page directed to auth', () => {
    cy.visit('/sign-in')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in fallback header', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.fallbackHeaderUserName.should('contain.text', 'J. Smith')
  })

  it('User can sign out', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.signOut.click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User sees links in footer but not Open Government Licence', () => {
    cy.signIn()
    Page.verifyOnPage(HomePage)
    it('Fallback footer exists with no content', () => {
      cy.signIn()
      cy.task('stubDpsComponentsFail')
      const indexPage = Page.verifyOnPage(HomePage)
      indexPage.fallbackFooter.should('include.text', 'Terms and conditions')
    })
  })

  it('Token verification failure takes user to sign in page', () => {
    cy.signIn()
    Page.verifyOnPage(HomePage)
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')
  })

  it('Token verification failure clears user session', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(HomePage)
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')

    cy.task('stubVerifyToken', true)
    cy.task('stubManageUser', 'bobby brown')
    cy.signIn()

    indexPage.headerUserName.contains('B. Brown')
  })
})
