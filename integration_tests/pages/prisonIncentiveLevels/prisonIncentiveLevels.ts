import Page, { type PageElement } from '../page'

export default class PrisonIncentiveLevelsPage extends Page {
  constructor() {
    super('Incentive level settings')
  }

  checkLastBreadcrumb() {
    this.breadcrumbs.last().should('contain.text', 'Incentive level settings')
  }

  get table(): PageElement<HTMLTableElement> {
    return cy.get('.govuk-table')
  }

  get contentsOfTable(): Cypress.Chainable<Record<string, [string, string]>> {
    return this.table.then($table => {
      const contentsOfTable: [string, [string, string]][] = []
      const rows = $table[0].getElementsByTagName('tr')
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index]
        const levelCell = row.getElementsByTagName('th')[0]
        const cells = row.getElementsByTagName('td')
        const [tagCell, linkCell] = [cells[0], cells[1]]
        contentsOfTable.push([levelCell.textContent.trim(), [tagCell.textContent.trim(), linkCell.textContent.trim()]])
      }
      return cy.wrap(Object.fromEntries(contentsOfTable))
    })
  }

  findTableLink(row: number, text: string): PageElement<HTMLAnchorElement> {
    return this.table.find('tr').eq(row).find('td:last').scrollIntoView().find(`a:contains(${text})`)
  }

  get addLink(): PageElement<HTMLAnchorElement> {
    return cy.get('a:contains(Add)')
  }
}
