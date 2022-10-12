export type HeaderCell =
  | {
      html: string
      attributes: {
        'aria-sort': 'ascending' | 'descending' | 'none'
      }
    }
  | { html: string }

/**
 * Produces parameters for head of GOV.UK Table component macro
 * to label sortable columns and add links
 */
export function sortableTableHead(
  columns: { column: string; escapedHtml: string; unsortable?: true }[],
  urlPrefix: string,
  sortColumn: string,
  order: 'ascending' | 'descending',
): HeaderCell[] {
  return columns.map(({ column, escapedHtml, unsortable }) => {
    if (unsortable) {
      return { html: escapedHtml }
    }

    let sortQuery: string
    let sortDescription: string
    if (column === sortColumn) {
      if (order === 'ascending') {
        sortQuery = `sort=${column}&order=descending`
        sortDescription = '<span class="govuk-visually-hidden">(sorted ascending)</span>'
      } else {
        sortQuery = `sort=${column}&order=ascending`
        sortDescription = '<span class="govuk-visually-hidden">(sorted descending)</span>'
      }
    } else {
      sortQuery = `sort=${column}&order=${order}`
      sortDescription = ''
    }
    return {
      html: `<a href="${urlPrefix}&${sortQuery}">${escapedHtml} ${sortDescription}</a>`,
      attributes: {
        'aria-sort': column === sortColumn ? order : 'none',
      },
    }
  })
}
