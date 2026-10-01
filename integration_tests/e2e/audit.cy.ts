context('Auditing page views to HMPPS Audit', () => {
  beforeEach(() => {
    cy.task('resetStubs')
    cy.task('stubFallbackHeaderAndFooter')
    cy.task('stubNomisUserRolesGetCaseloads')
    cy.task('stubManageUser')
    cy.task('stubNomisUserRolesApiUserCaseloads')
    cy.task('stubPrisonTopLevelLocations')
    cy.task('stubPrisonIncentiveLevels')
    cy.task('stubSignIn', { roles: ['ROLE_MAINTAIN_IEP'] })
    cy.task('stubGetIncentiveSummaryForPrisoner')
  })

  it('sends a page view and an access attempt for a prisoner’s incentive details', () => {
    cy.navigateToPrisonerIncentiveLevelDetails()

    const pageUrl = '/incentive-reviews/prisoner/A8083DY'
    const event = {
      who: 'USER1',
      service: 'hmpps-incentives-ui',
      subjectId: 'A8083DY',
      subjectType: 'PRISONER_ID',
      details: JSON.stringify({ pageUrl }),
    }
    cy.verifyAuditEvents(pageUrl, [
      { ...event, what: 'PAGE_VIEW' },
      { ...event, what: 'PAGE_VIEW_ACCESS_ATTEMPT' },
    ])
  })
})
