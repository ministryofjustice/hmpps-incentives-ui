import { type HeaderCell, sortableTableHead } from './sortableTable'

const sampleColumns = [
  { column: 'month', escapedHtml: 'Month you apply' },
  { column: 'rate', escapedHtml: 'Rate for vehicles' },
]

describe('sortableTableHead', () => {
  describe('should label sorted column with aria attribute', () => {
    it('when a column is sorted ascending', () => {
      expect(sortableTableHead(sampleColumns, '?size=large', 'month', 'ascending')).toEqual<HeaderCell[]>([
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'ascending' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
      ])
    })

    it('when a different column is sorted descending', () => {
      expect(sortableTableHead(sampleColumns, '?size=large', 'rate', 'descending')).toEqual<HeaderCell[]>([
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'none' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'descending' } },
      ])
    })

    it('when an uknown column is sorted', () => {
      expect(sortableTableHead(sampleColumns, '?size=large', 'unknown', 'descending')).toEqual<HeaderCell[]>([
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'none' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
      ])
    })
  })

  describe('should link column to sort action', () => {
    it('when a column is sorted ascending', () => {
      expect(sortableTableHead(sampleColumns, '?size=large', 'month', 'ascending')).toEqual([
        // flip order if same column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&sort=month&order=descending') }),
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&sort=rate&order=ascending') }),
      ])
    })

    it('when a different column is sorted descending', () => {
      expect(sortableTableHead(sampleColumns, '?size=large', 'rate', 'descending')).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&sort=month&order=descending') }),
        // flip order if same column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&sort=rate&order=ascending') }),
      ])
    })

    it('when an uknown column is sorted', () => {
      expect(sortableTableHead(sampleColumns, '?size=large', 'unknown', 'descending')).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&sort=month&order=descending') }),
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&sort=rate&order=descending') }),
      ])
    })
  })

  describe('should work with unsortable columns', () => {
    const sampleColumnsWithUnsortable: Parameters<typeof sortableTableHead>[0] = [
      { column: 'icon', escapedHtml: '<span class="govuk-visually-hidden">Icon &amp; label</span>', unsortable: true },
      ...sampleColumns,
    ]

    it('when another column is sorted', () => {
      expect(sortableTableHead(sampleColumnsWithUnsortable, '?size=large', 'month', 'ascending')).toEqual<HeaderCell[]>(
        [
          { html: '<span class="govuk-visually-hidden">Icon &amp; label</span>' },
          { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'ascending' } },
          { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
        ],
      )
    })

    it('when the unsortable column is sorted', () => {
      expect(sortableTableHead(sampleColumnsWithUnsortable, '?size=large', 'icon', 'descending')).toEqual<HeaderCell[]>(
        [
          { html: '<span class="govuk-visually-hidden">Icon &amp; label</span>' },
          { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'none' } },
          { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
        ],
      )
    })
  })
})
