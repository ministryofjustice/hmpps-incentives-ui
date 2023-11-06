import Page from '../pages/page'
import AboutAnalyticsPage from '../pages/aboutAnalytics'
import HomePage from '../pages/home'

context('About Analytics page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubNomisUserRolesGetCaseloads')
    cy.task('stubManageUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiLocations')
    cy.task('stubCreateZendeskTicket')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.aboutAnalyticsPageLink().click()
  })

  it('users can submit feedback', () => {
    let page = Page.verifyOnPage(AboutAnalyticsPage)
    page.checkLastBreadcrumb('Incentives', '/')

    // leave some comments and submit
    page.feedbackForm.find('[name=informationUseful][value=no]').click()
    page.feedbackForm.find('[name=noComments]').type('I’m very confused')
    page.feedbackForm.submit()

    // should remain on the same page with a success message and no error summary
    page = Page.verifyOnPage(AboutAnalyticsPage)
    page.messages.spread((...$divs) => {
      expect($divs).to.have.lengthOf(1)
      expect($divs[0]).to.contain('Your feedback has been submitted')
    })
    page.errorSummary.should('not.exist')
  })

  it('users will see errors if they submit invalid feedback', () => {
    let page = Page.verifyOnPage(AboutAnalyticsPage)

    // try to submit without selecting radio button
    page.feedbackForm.submit()

    // should remain on the same page with error message
    page = Page.verifyOnPage(AboutAnalyticsPage)
    page.messages.should('not.exist')
    page.errorSummaryTitle.contains('There is a problem')
    page.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Tell us if you found this information useful')
    })
  })
})
