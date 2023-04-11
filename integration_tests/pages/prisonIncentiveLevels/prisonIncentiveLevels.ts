import Page, { type PageElement } from '../page'

type TableRowContents = { tags: string; viewAction: string; removeAction: string | undefined }

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

  get contentsOfTable(): Cypress.Chainable<Record<string, TableRowContents>> {
    return this.table.then($table => {
      const contentsOfTable: [string, TableRowContents][] = []
      const rows = $table[0].getElementsByTagName('tr')
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index]
        const levelCell = row.getElementsByTagName('th')[0]
        const cells = row.getElementsByTagName('td')
        const [tagCell, viewCell, removeCell] = [cells[0], cells[1], cells[2]]
        const contents = {
          tags: tagCell.textContent.trim(),
          viewAction: viewCell.textContent.trim(),
          removeAction: removeCell?.textContent?.trim(),
        }
        contentsOfTable.push([levelCell.textContent.trim(), contents])
      }
      return cy.wrap(Object.fromEntries(contentsOfTable))
    })
  }

  findTableLink(row: number, text: string): PageElement<HTMLAnchorElement> {
    return this.table.find('tr').eq(row).scrollIntoView().find(`a:contains(${text})`)
  }

  get addLink(): PageElement<HTMLAnchorElement> {
    return cy.get('a:contains(Add)')
  }
}
