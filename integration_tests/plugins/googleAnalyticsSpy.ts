/**
 * Adds a spy for `gtag` (global function variable for Google Analytics) into loaded page
 */
export default class GoogleAnalyticsSpy {
  calls: unknown[]

  constructor() {
    this.calls = []
  }

  install() {
    return cy.window().then(win => {
      // eslint-disable-next-line no-param-reassign
      win.gtag = (...args: [string, string, Record<string, string>]) => {
        this.calls.push(args)
      }
      return cy.wrap(null)
    })
  }

  clear() {
    while (this.calls.length) this.calls.pop()
    return cy.wrap(null)
  }

  shouldHaveSentEvent(...call: [string, Record<string, string>]) {
    return cy.wrap(this.calls[this.calls.length - 1]).should('be.deep.equal', ['event', ...call])
  }

  shouldHaveSentEvents(...calls: [string, Record<string, string>][]) {
    return cy.wrap(this.calls).should(
      'be.deep.equal',
      calls.map(([eventName, eventParams]) => ['event', eventName, eventParams])
    )
  }
}
