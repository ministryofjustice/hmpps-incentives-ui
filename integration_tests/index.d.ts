declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Chainable<Subject = any> {
    /**
     * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
     * @example cy.signIn({ failOnStatusCode: boolean })
     */
    signIn(options?: { failOnStatusCode: boolean }): Chainable<Subject>
  }

  /**
   * Declare globals
   */
  interface ApplicationWindow {
    /** Google Analytics – Universal Analytics (deprecated) */
    ga?: (...args: string[]) => void

    /** Google Analytics version 4 */
    gtag?: (...args: [string, string, Record<string, string>]) => void
  }
}
