import { orderOptions } from '../data/incentivesApi'

type AriaSort = 'ascending' | 'descending' | 'none'
export type HeaderCell =
  | {
      html: string
      attributes: {
        'aria-sort': AriaSort
      }
    }
  | { html: string }

/**
 * Produces parameters for head of GOV.UK Table component macro
 * to label sortable columns and add links
 */
export function sortableTableHead<Column = string>(
  columns: { column: Column; escapedHtml: string; unsortable?: true }[],
  urlPrefix: string,
  sortColumn: Column,
  order: typeof orderOptions[number],
): HeaderCell[] {
  return columns.map(({ column, escapedHtml, unsortable }) => {
    if (unsortable) {
      return { html: escapedHtml }
    }

    let sortQuery: string
    let sortDescription: string
    if (column === sortColumn) {
      // flips order of the currently sorted column
      if (order === 'asc') {
        sortQuery = `sort=${column}&amp;order=desc`
        sortDescription = '<span class="govuk-visually-hidden">(sorted ascending)</span>'
      } else {
        sortQuery = `sort=${column}&amp;order=asc`
        sortDescription = '<span class="govuk-visually-hidden">(sorted descending)</span>'
      }
    } else {
      // preserves order if another column is sorted by
      sortQuery = `sort=${column}&amp;order=${order}`
      sortDescription = ''
    }
    return {
      html: `<a href="${urlPrefix}&amp;${sortQuery}">${escapedHtml} ${sortDescription}</a>`,
      attributes: {
        'aria-sort': column === sortColumn ? ariaSort[order] : 'none',
      },
    }
  })
}

const ariaSort: Record<typeof orderOptions[number], AriaSort> = {
  asc: 'ascending',
  desc: 'descending',
}
