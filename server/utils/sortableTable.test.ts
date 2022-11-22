import { type HeaderCell, sortableTableHead } from './sortableTable'

type Colum = 'month' | 'rate'
const sampleColumns: Parameters<typeof sortableTableHead<Colum>>[0] = [
  { column: 'month', escapedHtml: 'Month you apply' },
  { column: 'rate', escapedHtml: 'Rate for vehicles' },
]

describe('sortableTableHead', () => {
  describe('should label sorted column with aria attribute', () => {
    it('when a column is sorted ascending', () => {
      expect(sortableTableHead<Colum>(sampleColumns, '?size=large', 'month', 'ASC')).toEqual<HeaderCell[]>([
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'ascending' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
      ])
    })

    it('when a different column is sorted descending', () => {
      expect(sortableTableHead<Colum>(sampleColumns, '?size=large', 'rate', 'DESC')).toEqual<HeaderCell[]>([
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'none' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'descending' } },
      ])
    })

    it('when an uknown column is sorted', () => {
      expect(sortableTableHead<string>(sampleColumns, '?size=large', 'unknown', 'DESC')).toEqual<HeaderCell[]>([
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'none' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
      ])
    })
  })

  describe('should link column to sort action', () => {
    it('when a column is sorted ascending', () => {
      expect(sortableTableHead<Colum>(sampleColumns, '?size=large', 'month', 'ASC')).toEqual([
        // flip order if same column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=DESC') }),
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=ASC') }),
      ])
    })

    it('when a different column is sorted descending', () => {
      expect(sortableTableHead<Colum>(sampleColumns, '?size=large', 'rate', 'DESC')).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=DESC') }),
        // flip order if same column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=ASC') }),
      ])
    })

    it('when an uknown column is sorted', () => {
      expect(sortableTableHead<string>(sampleColumns, '?size=large', 'unknown', 'DESC')).toEqual([
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=month&amp;order=DESC') }),
        // preserve same order if different column clicked
        expect.objectContaining({ html: expect.stringContaining('?size=large&amp;sort=rate&amp;order=DESC') }),
      ])
    })
  })

  describe('should work with unsortable columns', () => {
    const sampleColumnsWithUnsortable: Parameters<typeof sortableTableHead<string>>[0] = [
      { column: 'icon', escapedHtml: '<span class="govuk-visually-hidden">Icon &amp; label</span>', unsortable: true },
      ...sampleColumns,
    ]

    it('when another column is sorted', () => {
      const tableHead = sortableTableHead<string>(sampleColumnsWithUnsortable, '?size=large', 'month', 'ASC')
      expect(tableHead).toEqual<HeaderCell[]>([
        { html: '<span class="govuk-visually-hidden">Icon &amp; label</span>' },
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'ascending' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
      ])
    })

    it('when the unsortable column is sorted', () => {
      const tableHead = sortableTableHead<string>(sampleColumnsWithUnsortable, '?size=large', 'icon', 'DESC')
      expect(tableHead).toEqual<HeaderCell[]>([
        { html: '<span class="govuk-visually-hidden">Icon &amp; label</span>' },
        { html: expect.stringContaining('Month you apply'), attributes: { 'aria-sort': 'none' } },
        { html: expect.stringContaining('Rate for vehicles'), attributes: { 'aria-sort': 'none' } },
      ])
    })
  })
})
