import Page, { type PageElement } from '../page'

type TableRowContents = {
  code: string
  status: string
  changeStatus: string | undefined
}

export default class IncentiveLevelsPage extends Page {
  constructor() {
    super('Global incentive level admin')
  }

  checkLastBreadcrumb() {
    this.breadcrumbs.last().should('contain.text', 'Global incentive level admin')
  }

  get table(): PageElement<HTMLTableElement> {
    return cy.get('.govuk-table')
  }

  get contentsOfTable(): Cypress.Chainable<Record<string, TableRowContents>> {
    return this.table.then($table => {
      const contentsOfTable: [string, TableRowContents][] = []
      const rows = $table.find('tbody')[0].getElementsByTagName('tr')
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index]
        const cells = row.getElementsByTagName('td')
        const [nameCell, codeCell, statusCell, changeStatusCell] = [cells[0], cells[1], cells[2], cells[3]]
        const contents: TableRowContents = {
          code: codeCell.textContent.trim(),
          status: statusCell.textContent.trim(),
          changeStatus: changeStatusCell?.textContent?.trim(),
        }
        contentsOfTable.push([nameCell.textContent.trim(), contents])
      }
      return cy.wrap(Object.fromEntries(contentsOfTable))
    })
  }

  findTableLink(row: number, text: string): PageElement<HTMLAnchorElement> {
    return this.table.find('tr').eq(row).scrollIntoView().find(`a:contains(${text})`)
  }

  get createLink(): PageElement<HTMLAnchorElement> {
    return cy.get('a:contains(Create)')
  }
}
