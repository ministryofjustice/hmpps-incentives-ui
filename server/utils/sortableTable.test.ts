import { type HeaderCell, type SortableTableColumns, sortableTableHead } from './sortableTable'

type Column = 'month' | 'rate'
const sampleColumns: SortableTableColumns<Column> = [
  { column: 'month', escapedHtml: 'Month you apply' },
  { column: 'rate', escapedHtml: 'Rate for vehicles' },
]

describe('sortableTableHead', () => {
  describe('should label sorted column with aria attribute', () => {
    it('when a column is sorted ascending', () => {
      expect(
        sortableTableHead<Column>({
          gaPrefix: 'Reviews table',
          columns: sampleColumns,
          urlPrefix: '?size=large',
          sortColumn: 'month',
          order: 'ASC',
        })
      ).toEqual<HeaderCell[]>([
        {
          html: expect.stringContaining('Month you apply'),
          attributes: {
            'aria-sort': 'ascending',
            'data-ga-category': 'Reviews table > Sorted table',
            'data-ga-action': 'by month',
          },
        },
        {
          html: expect.stringContaining('Rate for vehicles'),
          attributes: {
            'aria-sort': 'none',
            'data-ga-category': 'Reviews table > Sorted table',
            'data-ga-action': 'by rate',
          },
        },
      ])
    })

    it('when a different column is sorted descending', () => {
      expect(
        sortableTableHead<Column>({
          gaPrefix: 'Reviews table',
          columns: sampleColumns,
          urlPrefix: '?size=large',
          sortColumn: 'rate',
          order: 'DESC',
        })
      ).toEqual<HeaderCell[]>([
        {
          html: expect.stringContaining('Month you apply'),
          attributes: {
            'aria-sort': 'none',
            'data-ga-category': 'Reviews table > Sorted table',
            'data-ga-action': 'by month',
          },
        },
        {
          html: expect.stringContaining('Rate for vehicles'),
          attributes: {
            'aria-sort': 'descending',
            'data-ga-category': 'Reviews table > Sorted table',
            'data-ga-action': 'by rate',
          },
        },
      ])
    })

    it('when an uknown column is sorted', () => {
      expect(
        sortableTableHead<string>({
          gaPrefix: 'Reviews table',
          columns: sampleColumns,
          urlPrefix: '?size=large',
          sortColumn: 'unknown',
          order: 'DESC',
        })
      ).toEqual<HeaderCell[]>([
        {
          html: expect.stringContaining('Month you apply'),
          attributes: {
            'aria-sort': 'none',
            'data-ga-category': 'Reviews table > Sorted table',
            'data-ga-action': 'by month',
          },
        },
        {
          html: expect.stringContaining('Rate for vehicles'),
          attributes: {
            'aria-sort': 'none',
            'data-ga-category': 'Reviews table > Sorted table',
            'data-ga-action': 'by rate',
          },
        },
      ])
    })
  })

  describe('should link column to sort action', () => {
    it('when a column is sorted ascending', () => {
      expect(
        sortableTableHead<Column>({
          gaPrefix: 'Reviews table',
          columns: sampleColumns,
          urlPrefix: '?size=large',
          sortColumn: 'month',
          order: 'ASC',
        })
      ).toEqual([
        // flip order if same column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=DESC') }),
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=ASC') }),
      ])
    })

    it('when a different column is sorted descending', () => {
      expect(
        sortableTableHead<Column>({
          gaPrefix: 'Reviews table',
          columns: sampleColumns,
          urlPrefix: '?size=large',
          sortColumn: 'rate',
          order: 'DESC',
        })
      ).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=DESC') }),
        // flip order if same column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=ASC') }),
      ])
    })

    it('when an uknown column is sorted', () => {
      expect(
        sortableTableHead<string>({
          gaPrefix: 'Reviews table',
          columns: sampleColumns,
          urlPrefix: '?size=large',
          sortColumn: 'unknown',
          order: 'DESC',
        })
      ).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=DESC') }),
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=DESC') }),
      ])
    })
  })

  describe('should work with unsortable columns', () => {
    const sampleColumnsWithUnsortable: SortableTableColumns<string> = [
      { column: 'icon', escapedHtml: '<span class="govuk-visually-hidden">Icon &amp; label</span>', unsortable: true },
      ...sampleColumns,
    ]

    it('when another column is sorted', () => {
      const tableHead = sortableTableHead<string>({
        gaPrefix: 'Reviews table',
        columns: sampleColumnsWithUnsortable,
        urlPrefix: '?size=large',
        sortColumn: 'month',
        order: 'ASC',
      })
      expect(tableHead).toEqual<HeaderCell[]>([
        { html: '<span class="govuk-visually-hidden">Icon &amp; label</span>' },
        {
          html: expect.stringContaining('Month you apply'),
          attributes: {
            'aria-sort': 'ascending',
            'data-ga-category': 'Reviews table > Sorted table',
            'data-ga-action': 'by month',
          },
        },
        {
          html: expect.stringContaining('Rate for vehicles'),
          attributes: {
            'aria-sort': 'none',
            'data-ga-category': 'Reviews table > Sorted table',
            'data-ga-action': 'by rate',
          },
        },
      ])
    })

    it('when the unsortable column is sorted', () => {
      const tableHead = sortableTableHead<string>({
        gaPrefix: 'Reviews table',
        columns: sampleColumnsWithUnsortable,
        urlPrefix: '?size=large',
        sortColumn: 'icon',
        order: 'DESC',
      })
      expect(tableHead).toEqual<HeaderCell[]>([
        { html: '<span class="govuk-visually-hidden">Icon &amp; label</span>' },
        {
          html: expect.stringContaining('Month you apply'),
          attributes: {
            'aria-sort': 'none',
            'data-ga-category': 'Reviews table > Sorted table',
            'data-ga-action': 'by month',
          },
        },
        {
          html: expect.stringContaining('Rate for vehicles'),
          attributes: {
            'aria-sort': 'none',
            'data-ga-category': 'Reviews table > Sorted table',
            'data-ga-action': 'by rate',
          },
        },
      ])
    })
  })
})
