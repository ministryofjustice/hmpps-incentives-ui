context('Getting a prisoner image', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
  })

  context('when authenticated', () => {
    beforeEach(() => {
      cy.task('stubAuthUser')
      cy.task('stubPrisonApiLocations')
      cy.task('stubPrisonApiImages')

      cy.signIn()
    })

    it('responds 200 OK', () => {
      cy.request('/prisoner-images/123.jpeg').then(resp => {
        expect(resp.redirectedToUrl).to.eq(undefined)
        expect(resp.status).to.eq(200)
        expect(resp.headers['content-type']).to.eq('images/jpeg')
      })
    })
  })

  context('when not authenticated', () => {
    it('redirects to login page', () => {
      cy.request('/prisoner-images/123.jpeg')
        .its('headers.location')
        .should('equal', 'http://localhost:3007/sign-in/callback?code=codexxxx&state=stateyyyy')
    })
  })
})
