import Page from '../pages/page'
import PrisonerChangeIncentiveLevelDetailsPage from '../pages/prisonerIncentiveLevels/prisonerChangeIncentiveLevelDetailsPage'
// import PrisonerChangeIncentiveLevelConfirmationPage from '../pages/prisonerIncentiveLevels/prisonerChangeIncentiveLevelDetailsConfirmationPage'

// const iepSummaryForBooking = {
//   bookingId: -1,
//   iepDate: '2017-08-15',
//   iepTime: '2017-08-15T16:04:35',
//   iepLevel: 'Standard',
//   daysSinceReview: 625,
//   nextReviewDate: '2018-08-15',
// }
//
// const prisonIncentiveLevels = [
//   { levelCode: 'BAS', levelName: 'Basic', active: true, defaultOnAdmission: false },
//   { levelCode: 'STD', levelName: 'Standard', active: true, defaultOnAdmission: true },
//   { levelCode: 'ENH', levelName: 'Enhanced', active: true, defaultOnAdmission: false },
// ]
context('Prisoner change incentive level details', () => {

  beforeEach(() => {
    cy.task('stubFallbackHeaderAndFooter')
    cy.task('stubNomisUserRolesGetCaseloads')
    cy.task('stubManageUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiLocations')
    cy.task('stubPrisonIncentiveLevels')
  })

  context('When user has CORRECT role', () => {
    beforeEach(() => {
      const roles = ['ROLE_MAINTAIN_IEP']
      cy.task('stubSignIn', { roles })
      cy.task('stubGetIncentiveSummaryForPrisoner')
      cy.navigateToChangePrisonerIncentiveLevelDetails().then(result => {
        return result
      })
    })

    xit('should display prisoner name and current level', () => {
      const page = Page.verifyOnPage(PrisonerChangeIncentiveLevelDetailsPage)
      page.pageHeading.should('contain.text', 'Record John Smith’s incentive level')
      page.currentIncentiveLevel.should('contain.text', 'Standard')
      page.newLevel.should('contain.text', 'Standard (current level)')
    })

    //
    // TODO: check form is submitted and confirmation page is rendered correctly.
    //

    it('should submit the form and display confirmation page', () => {
      const page = Page.verifyOnPage(PrisonerChangeIncentiveLevelDetailsPage)

      page.radioButton.first().click()
      page.changeReason.type('Test comment. ')
      page.submitChange.click()

      // const confirmationPage = Page.verifyOnPage(PrisonerChangeIncentiveLevelConfirmationPage)

      cy.get('[data-test="current-incentive-level"]').should('contain', 'Basic')
      cy.get('[data-test="next-review-date"]').should('contain', '26 September 2022')
    })

    xit('should display missing form input errors', () => {
      const page = Page.verifyOnPage(PrisonerChangeIncentiveLevelDetailsPage)
      page.submitChange.click()
      page.formErrors.should('contain.text', 'Select an incentive level, even if it is the same as before')
      page.newLevelError.should('contain.text', 'Select an incentive level, even if it is the same as before')
      page.formErrors.should('contain.text', 'Enter a reason for recording')
      page.reasonError.should('contain.text', 'Enter a reason for recording')
    })

    xit('should display max reason length error', () => {
      const page = Page.verifyOnPage(PrisonerChangeIncentiveLevelDetailsPage)
      page.radioButton.first().click()
      page.changeReason.type('Test comment. '.repeat(18))
      page.submitChange.click()
      page.formErrors.should('contain.text', 'Comments must be 240 characters or less')
    })
  })

  context('When user has INCORRECT role', () => {
    beforeEach(() => {
      const roles = ['']
      cy.task('stubSignIn', { roles })
    })

    xit('should display the change incentive level link', () => {
      cy.task('stubGetIncentiveSummaryForPrisoner')
      cy.navigateToChangePrisonerIncentiveLevelDetails().then(result => {
        return result
      })
      const page = Page.verifyOnPage(PrisonerChangeIncentiveLevelDetailsPage)

    })

  })


})
