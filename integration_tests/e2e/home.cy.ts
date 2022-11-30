import Page from '../pages/page'
import AboutPage from '../pages/about'
import HomePage from '../pages/home'

context('Home page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiLocations')
  })

  it('should open card when clicked anywhere inside', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.cards.last().find('.card__description').contains('Information on how we collect').click()
    Page.verifyOnPage(AboutPage)
  })
})
