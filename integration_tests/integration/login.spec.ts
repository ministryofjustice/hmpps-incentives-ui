import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'
import AuthManageDetailsPage from '../pages/authManageDetails'
import HomePage from '../pages/home'

context('SignIn', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiLocations')
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in header', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.headerUserName().should('contain.text', 'J. Smith')
  })

  it('User can log out', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User can manage their details', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)

    homePage.manageDetails().get('a').invoke('removeAttr', 'target')
    homePage.manageDetails().click()
    Page.verifyOnPage(AuthManageDetailsPage)
  })

  it('User sees links in footer but not Open Government Licence', () => {
    cy.signIn()
    Page.verifyOnPage(HomePage)

    cy.get('.govuk-footer__inline-list .govuk-footer__link:visible').then(footerLinks => {
      expect(footerLinks.length).equal(2)

      const getHelpLink = footerLinks.first()
      const TsAndCsLink = footerLinks.last()

      expect(getHelpLink).to.contain('Get help')
      expect(TsAndCsLink).to.contain('Terms and conditions')
    })
  })
})
