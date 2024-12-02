context('Healthcheck', () => {
  context('All healthy', () => {
    beforeEach(() => {
      cy.task('resetStubs')
      cy.task('stubAuthPing')
      cy.task('stubIncentivesApiPing')
      cy.task('stubOffenderSearchApiPing')
      cy.task('stubPrisonApiPing')
      cy.task('stubNomisUserRolesApiPing')
      cy.task('stubManageUsersPing')
      cy.task('stubTokenVerificationPing')
    })

    it('Health check page is visible', () => {
      cy.request('/health').its('body.healthy').should('equal', true)
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body.status').should('equal', 'UP')
    })
  })

  context('Some unhealthy', () => {
    it('Reports correctly when token verification down', () => {
      cy.task('resetStubs')
      cy.task('stubAuthPing')
      cy.task('stubTokenVerificationPing', 500)

      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.components.hmppsAuth.status).to.equal('UP')
        expect(response.body.components.tokenVerification.status).to.equal('DOWN')
        expect(response.body.components.tokenVerification.details).to.contain({ status: 500, attempts: 3 })
      })
    })
  })
})
