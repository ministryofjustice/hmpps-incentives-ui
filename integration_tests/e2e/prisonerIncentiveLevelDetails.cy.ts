import type { IncentiveReviewHistory } from '../../server/data/incentivesApi'
import { emptyIncentiveSummaryForBooking } from '../../server/testData/incentivesApi'
import Page from '../pages/page'
import PrisonerIncentiveLevelDetailsPage from '../pages/prisonerIncentiveLevels/prisonerIncentiveLevelDetailsPage'

context('Prisoner incentive level details', () => {
  beforeEach(() => {
    cy.task('stubFallbackHeaderAndFooter')
    cy.task('stubNomisUserRolesGetCaseloads')
    cy.task('stubManageUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonApiLocations')
    cy.task('stubPrisonIncentiveLevels')
  })

  context('When user has correct role', () => {
    beforeEach(() => {
      const roles = ['ROLE_MAINTAIN_IEP']
      cy.task('stubSignIn', { roles })
    })

    it('should display the change incentive level link', () => {
      cy.task('stubGetIncentiveSummaryForPrisoner')
      cy.navigateToPrisonerIncentiveLevelDetails()
      const page = Page.verifyOnPage(PrisonerIncentiveLevelDetailsPage)
      page.recordIncentiveLevelButton.should('exist')
    })

    it('should show when the next review date is', () => {
      cy.task('stubGetIncentiveSummaryForPrisoner')
      cy.navigateToPrisonerIncentiveLevelDetails()
      const page = Page.verifyOnPage(PrisonerIncentiveLevelDetailsPage)
      page.nextReviewDate.should('contain.text', '15 August 2018')
      page.nextReviewOverdue.should('exist').should('contain.text', 'days overdue')
    })

    it('should NOT show that the next review is overdue', () => {
      const today = new Date()
      const lastReviewDate = new Date(today)
      lastReviewDate.setDate(lastReviewDate.getDate() - 10)
      const lastReviewDateIso = lastReviewDate.toISOString()
      const nextReviewDate = new Date(today)
      nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1)
      const nextReviewDateIso = nextReviewDate.toISOString()
      // pretend the last review was 10 days ago
      cy.task('stubGetIncentiveSummaryForPrisoner', {
        ...emptyIncentiveSummaryForBooking,
        iepDetails: [],
        iepDate: lastReviewDateIso.split('T')[0],
        iepTime: lastReviewDateIso,
        nextReviewDate: nextReviewDateIso,
      } satisfies DatesAsStrings<IncentiveReviewHistory>)
      cy.navigateToPrisonerIncentiveLevelDetails()
      cy.visit('/incentive-reviews/prisoner/A8083DY')
      const page = Page.verifyOnPage(PrisonerIncentiveLevelDetailsPage)
      page.nextReviewOverdue.should('not.exist')
    })

    it('should show the correct incentive level history', () => {
      cy.task('stubGetIncentiveSummaryForPrisoner')
      cy.navigateToPrisonerIncentiveLevelDetails()
      const page = Page.verifyOnPage(PrisonerIncentiveLevelDetailsPage)
      page.incentiveLevelHistoryTable.then($table => {
        // @ts-expect-error ignore-error
        cy.get($table)
          .find('td')
          .then($tableCells => {
            // @ts-expect-error ignore-error
            cy.get($tableCells).its('length').should('eq', 15)

            expect($tableCells.get(0)).to.contain('15 August 2017, 16:04')
            expect($tableCells.get(1)).to.contain('Standard')
            expect($tableCells.get(2)).to.contain('INCENTIVES_API_COMMENT')
            expect($tableCells.get(3)).to.contain('Moorland')
            expect($tableCells.get(4)).to.contain('System')

            expect($tableCells.get(5)).to.contain('10 August 2017, 16:04')
            expect($tableCells.get(6)).to.contain('Basic')
            expect($tableCells.get(7)).to.contain('BASIC_STAFF_USER_COMMENT')
            expect($tableCells.get(8)).to.contain('Leeds')
            expect($tableCells.get(9)).to.contain('Staff User')

            expect($tableCells.get(10)).to.contain('7 August 2017, 16:04')
            expect($tableCells.get(11)).to.contain('Enhanced')
            expect($tableCells.get(12)).to.contain('ENHANCED_ANOTHER_USER_COMMENT')
            expect($tableCells.get(13)).to.contain('Moorland')
            expect($tableCells.get(14)).to.contain('Another User')
          })
      })
    })

    it('should filter correctly and return only one response', () => {
      cy.task('stubGetIncentiveSummaryForPrisoner')
      cy.navigateToPrisonerIncentiveLevelDetails()
      const page = Page.verifyOnPage(PrisonerIncentiveLevelDetailsPage)
      page.clearFilter.should('not.exist')
      page.establishmentSelect.select('LEI')
      page.incentiveLevelSelect.select('Basic')
      page.filterSubmit.click()
      page.clearFilter.should('exist')
      page.incentiveLevelHistoryTable.then($table => {
        // @ts-expect-error ignore-error
        cy.get($table)
          .find('td')
          .then($tableCells => {
            // @ts-expect-error ignore-error
            cy.get($tableCells).its('length').should('eq', 5)

            expect($tableCells.get(0)).to.contain('10 August 2017, 16:04')
            expect($tableCells.get(1)).to.contain('Basic')
            expect($tableCells.get(2)).to.contain('BASIC_STAFF_USER_COMMENT')
            expect($tableCells.get(3)).to.contain('Leeds (HMP)')
            expect($tableCells.get(4)).to.contain('Staff User')
          })
      })
    })

    it('should filter correctly, return no data and show the default message', () => {
      cy.task('stubGetIncentiveSummaryForPrisoner')
      cy.navigateToPrisonerIncentiveLevelDetails()
      const page = Page.verifyOnPage(PrisonerIncentiveLevelDetailsPage)
      page.fromDate.type('01/01/2023', { force: true })
      page.filterSubmit.click()
      page.noIncentiveLevelHistory.should('exist')
    })

    it('should show the default message when no incentive level history is returned', () => {
      cy.task('stubGetIncentiveSummaryForPrisoner', {
        ...emptyIncentiveSummaryForBooking,
      })
      cy.navigateToPrisonerIncentiveLevelDetails()
      const page = Page.verifyOnPage(PrisonerIncentiveLevelDetailsPage)
      page.noIncentiveLevelHistory.should('exist')
    })
  })

  context('When user doesnt have correct role', () => {
    beforeEach(() => {
      const roles = ['']
      cy.task('stubSignIn', { roles })
      cy.task('stubGetIncentiveSummaryForPrisoner')
      cy.navigateToPrisonerIncentiveLevelDetails()
    })

    it('should NOT display the change incentive level link', () => {
      const page = Page.verifyOnPage(PrisonerIncentiveLevelDetailsPage)
      page.recordIncentiveLevelButton.should('not.exist')
    })
  })
})
