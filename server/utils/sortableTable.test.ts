import { type HeaderCell, sortableTableHead } from './sortableTable'

type Colum = 'month' | 'rate'
const sampleColumns: Parameters<typeof sortableTableHead<Colum>>[0] = [
  { column: 'month', escapedHtml: 'Month you apply' },
  { column: 'rate', escapedHtml: 'Rate for vehicles' },
]

describe('sortableTableHead', () => {
  describe('should label sorted column with aria attribute', () => {
    it('when a column is sorted ascending', () => {
      expect(sortableTableHead<Colum>(sampleColumns, '?size=large', 'month', 'asc')).toEqual<HeaderCell[]>([
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'ascending' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
      ])
    })

    it('when a different column is sorted descending', () => {
      expect(sortableTableHead<Colum>(sampleColumns, '?size=large', 'rate', 'desc')).toEqual<HeaderCell[]>([
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'none' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'descending' } },
      ])
    })

    it('when an uknown column is sorted', () => {
      expect(sortableTableHead<string>(sampleColumns, '?size=large', 'unknown', 'desc')).toEqual<HeaderCell[]>([
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'none' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
      ])
    })
  })

  describe('should link column to sort action', () => {
    it('when a column is sorted ascending', () => {
      expect(sortableTableHead<Colum>(sampleColumns, '?size=large', 'month', 'asc')).toEqual([
        // flip order if same column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=desc') }),
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=asc') }),
      ])
    })

    it('when a different column is sorted descending', () => {
      expect(sortableTableHead<Colum>(sampleColumns, '?size=large', 'rate', 'desc')).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=desc') }),
        // flip order if same column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=asc') }),
      ])
    })

    it('when an uknown column is sorted', () => {
      expect(sortableTableHead<string>(sampleColumns, '?size=large', 'unknown', 'desc')).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=desc') }),
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=desc') }),
      ])
    })
  })

  describe('should work with unsortable columns', () => {
    const sampleColumnsWithUnsortable: Parameters<typeof sortableTableHead<string>>[0] = [
      { column: 'icon', escapedHtml: '<span class="govuk-visually-hidden">Icon &amp; label</span>', unsortable: true },
      ...sampleColumns,
    ]

    it('when another column is sorted', () => {
      const tableHead = sortableTableHead<string>(sampleColumnsWithUnsortable, '?size=large', 'month', 'asc')
      expect(tableHead).toEqual<HeaderCell[]>([
        { html: '<span class="govuk-visually-hidden">Icon &amp; label</span>' },
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'ascending' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
      ])
    })

    it('when the unsortable column is sorted', () => {
      const tableHead = sortableTableHead<string>(sampleColumnsWithUnsortable, '?size=large', 'icon', 'desc')
      expect(tableHead).toEqual<HeaderCell[]>([
        { html: '<span class="govuk-visually-hidden">Icon &amp; label</span>' },
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'none' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
      ])
    })
  })
})
