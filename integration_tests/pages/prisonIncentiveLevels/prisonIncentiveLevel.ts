import Page, { type PageElement } from '../page'

export default class PrisonIncentiveLevelPage extends Page {
  constructor(private readonly levelName: string = 'Standard') {
    super(`View settings for ${levelName}`)
  }

  checkLastBreadcrumb() {
    this.breadcrumbs.last().should('contain.text', this.title)
  }

  get tables(): PageElement<HTMLTableElement> {
    return cy.get('.govuk-table')
  }

  get contentsOfTables(): Cypress.Chainable<Record<string, string>[]> {
    return this.tables.then($tables => {
      const contentsOfTables: Record<string, string>[] = $tables
        .map<Record<string, string>>((_index, table) => {
          const contentsOfTable: [string, string][] = []
          const rows = table.getElementsByTagName('tr')
          for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index]
            const cells = row.getElementsByTagName('td')
            const [nameCell, valueCell] = [cells[0], cells[1]]
            contentsOfTable.push([nameCell.textContent.trim(), valueCell.textContent.trim()])
          }
          return Object.fromEntries(contentsOfTable)
        })
        .toArray()
      return cy.wrap(contentsOfTables)
    })
  }

  get changeLink(): PageElement<HTMLAnchorElement> {
    return cy.get('a:contains(Change)')
  }

  get returnLink(): PageElement<HTMLAnchorElement> {
    return cy.get('a:contains(Return)')
  }
}
