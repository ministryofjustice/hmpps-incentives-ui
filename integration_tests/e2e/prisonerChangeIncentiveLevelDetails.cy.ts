import Page from '../pages/page'
import PrisonerChangeIncentiveLevelDetailsPage from '../pages/prisonerIncentiveLevels/prisonerChangeIncentiveLevelDetailsPage'
import PrisonerChangeIncentiveLevelConfirmationPage from '../pages/prisonerIncentiveLevels/prisonerChangeIncentiveLevelDetailsConfirmationPage'

const IncentiveSummary = {
  bookingId: -1,
  iepDate: '2017-08-15',
  iepTime: '2017-08-15T16:04:35',
  iepLevel: 'Basic',
  daysSinceReview: 1868,
  nextReviewDate: '2022-09-26',
  iepDetails: [
    {
      bookingId: -1,
      iepDate: '2017-08-15',
      iepTime: '2017-08-15T16:04:35',
      agencyId: 'MDI',
      iepLevel: 'Basic',
      userId: 'INCENTIVES_API',
      comments: 'INCENTIVES_API_COMMENT',
    },
  ],
}
context('Prisoner change incentive level details', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubFallbackHeaderAndFooter')
    cy.task('stubNomisUserRolesGetCaseloads')
    cy.task('stubManageUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiLocations')
    cy.task('stubPrisonIncentiveLevels')

    const roles = ['ROLE_MAINTAIN_IEP']
    cy.task('stubSignIn', { roles })
    cy.navigateToChangePrisonerIncentiveLevelDetails()
  })

  context('When user has CORRECT role', () => {
    it('should display prisoner name and current level', () => {
      const page = Page.verifyOnPage(PrisonerChangeIncentiveLevelDetailsPage)
      page.pageHeading.should('contain.text', 'Record John Smith’s incentive level')
      page.currentIncentiveLevel.should('contain.text', 'Standard')
      page.newLevel.should('contain.text', 'Standard (current level)')
    })

    it('should submit the form and display confirmation page', () => {
      const page = Page.verifyOnPage(PrisonerChangeIncentiveLevelDetailsPage)
      cy.task('stubGetIncentiveSummaryForPrisoner', IncentiveSummary)
      page.radioButton.first().click()
      page.changeReason.type('Test comment. ')
      cy.task('stubGetPrisonerFullDetailsTrue')
      cy.task('stubUpdateIncentiveLevelForPrisoner')
      page.submitChange.click()
      const confirmationPage = Page.verifyOnPage(PrisonerChangeIncentiveLevelConfirmationPage)
      confirmationPage.newIncentiveLevel.should('contain', 'Basic')
      confirmationPage.nextReviewDate.should('contain', '26 September 2022')
    })

    it('should display missing form input errors', () => {
      const page = Page.verifyOnPage(PrisonerChangeIncentiveLevelDetailsPage)
      page.submitChange.click()
      page.formErrors.should('contain.text', 'Select an incentive level, even if it is the same as before')
      page.newLevelError.should('contain.text', 'Select an incentive level, even if it is the same as before')
      page.formErrors.should('contain.text', 'Enter a reason for recording')
      page.reasonError.should('contain.text', 'Enter a reason for recording')
    })

    it('should display max reason length error', () => {
      const page = Page.verifyOnPage(PrisonerChangeIncentiveLevelDetailsPage)
      page.radioButton.first().click()
      page.changeReason.type('Test comment. '.repeat(18))
      page.submitChange.click()
      page.formErrors.should('contain.text', 'Comments must be 240 characters or less')
    })
  })

  context('should track clicks', () => {
    beforeEach(() => {
      const page = Page.verifyOnPage(PrisonerChangeIncentiveLevelDetailsPage)
      cy.task('stubGetIncentiveSummaryForPrisoner', IncentiveSummary)
      page.radioButton.first().click()
      page.changeReason.type('Test comment. ')
      cy.task('stubGetPrisonerFullDetailsTrue')
      cy.task('stubUpdateIncentiveLevelForPrisoner')
      page.submitChange.click()
    })

    it('click on manage reviews', () => {
      const confirmationPage = Page.verifyOnPage(PrisonerChangeIncentiveLevelConfirmationPage)
      confirmationPage.newIncentiveLevel.should('contain', 'Basic')
      confirmationPage.nextReviewDate.should('contain', '26 September 2022')

      cy.trackGoogleAnalyticsCalls().then(googleAnalyticsTracker => {
        confirmationPage.goToManageIncentives.click()
        cy.then(() => {
          googleAnalyticsTracker.shouldHaveLastSent('event', 'incentives_event', {
            category: 'Record incentive level confirmation',
            action: 'Manage reviews',
          })
        })
      })
    })

    it('click on prisoner profile', () => {
      const confirmationPage = Page.verifyOnPage(PrisonerChangeIncentiveLevelConfirmationPage)
      confirmationPage.newIncentiveLevel.should('contain', 'Basic')
      confirmationPage.nextReviewDate.should('contain', '26 September 2022')
      cy.trackGoogleAnalyticsCalls().then(googleAnalyticsTracker => {
        confirmationPage.goToPrisonerProfile.click()
        cy.then(() => {
          googleAnalyticsTracker.shouldHaveLastSent('event', 'incentives_event', {
            category: 'Record incentive level confirmation',
            action: 'Prisoner profile',
          })
        })
      })
    })
  })
})
