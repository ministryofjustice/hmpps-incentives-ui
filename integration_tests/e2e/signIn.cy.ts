import Page from '../pages/page'
import AuthSignInPage from '../pages/authSignIn'
import HomePage from '../pages/home'

context('Sign in', () => {
  beforeEach(() => {
    cy.task('resetStubs')
    cy.task('stubSignIn')
    cy.task('stubFallbackHeaderAndFooter')
    cy.task('stubManageUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiLocations')
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

  it('Official sensitive shows in fallback footer', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(HomePage)
    indexPage.fallbackFooter.should('include.text', 'Official sensitive')
  })

  it('Token verification failure takes user to sign in page', () => {
    cy.signIn()
    Page.verifyOnPage(HomePage)
    cy.task('stubVerifyToken', false)

    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Token verification failure clears user session', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(HomePage)
    cy.task('stubVerifyToken', false)

    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)

    cy.task('stubVerifyToken', true)
    cy.task('stubManageUser', 'bobby brown')
    cy.signIn()

    indexPage.headerUserName.contains('B. Brown')
  })

  it('Frontend components load', () => {
    cy.signIn()
    cy.task('stubFrontendComponentsHeaderAndFooter')
    cy.visit('/')
    Page.verifyOnPage(HomePage)
    cy.get('header').should('have.css', 'background-color', 'rgb(255, 0, 0)')
    cy.get('footer').should('have.css', 'background-color', 'rgb(255, 255, 0)')
    cy.window().its('FrontendComponentsHeaderDidLoad').should('be.true')
    cy.window().its('FrontendComponentsFooterDidLoad').should('be.true')
  })
})
