import Page from '../pages/page'
import AboutNationalPolicyPage from '../pages/aboutNationalPolicy'
import HomePage from '../pages/home'

context('About National policy page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubPrisonApiLocations')

    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.aboutNationalPolicyLink().click()
  })

  it('contains a summary of the National incentives policy', () => {
    Page.verifyOnPage(AboutNationalPolicyPage)

    cy.get('p').contains(
      'The national incentives policy framework (2020) is designed to help prisons incentivise good behaviour.',
    )

    cy.get('div.govuk-warning-text').contains(
      'Your local policy may require more frequent reviews. Check your policy document for details.',
    )

    cy.get('h2').contains('Key facts')
    cy.get('p').contains(
      'All prisoners must be given a review at least once a year, regardless of their incentive level.',
    )

    cy.get('h3').contains('New prisoners')
    cy.get('p').contains('Young people should be reviewed within 1 month of arrival.')

    cy.get('h3').contains('Prisoners on Basic')
    cy.get('p').contains('All prisoners must be reviewed within 7 days of moving to Basic.')

    cy.get('a[href="https://www.gov.uk/government/publications/incentives-policy-framework"]').contains(
      'Read the full national incentives policy framework (GOV.UK)',
    )
  })
})
