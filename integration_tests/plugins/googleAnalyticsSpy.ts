/**
 * Adds a spy for `ga` (global function variable for Google Analytics) into loaded page
 */
export default class GoogleAnalyticsSpy {
  calls: unknown[]

  constructor() {
    this.calls = []
  }

  install() {
    return cy.window().then(win => {
      // eslint-disable-next-line no-param-reassign
      win.ga = (...args: string[]) => {
        this.calls.push(args)
      }
    })
  }

  clear() {
    while (this.calls.length) this.calls.pop()
  }

  shouldHaveSentEvent(...call: string[]) {
    expect(this.calls[this.calls.length - 1], 'Last call to Google Analytics should be an event').to.deep.equal([
      'send',
      'event',
      ...call,
    ])
  }

  shouldHaveSentEvents(...calls: string[][]) {
    const expectedEventCalls = calls.map(call => ['send', 'event', ...call])
    expect(this.calls, 'Google Analytics should have been called with events').to.deep.equal(expectedEventCalls)
  }
}
