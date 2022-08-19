import {
  addMissingMonths,
  compareLocations,
  compareCharacteristics,
  compareMonths,
  removeSortingPrefix,
  removeMonthsOutsideBounds,
} from './analyticsServiceUtils'
import type { TrendsReportRow } from './analyticsServiceTypes'

describe('comparators and filters', () => {
  describe.each([
    { a: { label: 'All' }, b: { label: '1' }, expected: -1 },
    { a: { label: 'Non-wing' }, b: { label: '1' }, expected: 1 },
    { a: { label: 'Non-wing' }, b: { label: 'All' }, expected: 1 },
    { a: { label: 'Unknown' }, b: { label: '1' }, expected: 1 },
    { a: { label: 'Unknown' }, b: { label: 'All' }, expected: 1 },
    { a: { label: 'A' }, b: { label: 'All' }, expected: 1 },
    { a: { label: '1' }, b: { label: 'A' }, expected: -1 },
    { a: { label: '1' }, b: { label: 'Non-wing' }, expected: -1 },
    { a: { label: '1' }, b: { label: 'Unknown' }, expected: -1 },
    { a: { label: 'A' }, b: { label: '1' }, expected: 1 },
    { a: { label: 'A' }, b: { label: 'B' }, expected: -1 },
    { a: { label: 'SEG' }, b: { label: 'X' }, expected: 1 },
    { a: { label: 'RECP' }, b: { label: 'SEG' }, expected: -1 },
    { a: { label: 'RECP' }, b: { label: 'Non-wing' }, expected: -1 },
    { a: { label: 'RECP' }, b: { label: 'Unknown' }, expected: -1 },
    { a: { label: 'Unknown' }, b: { label: 'Non-wing' }, expected: 1 },
  ])('compareLocations()', ({ a, b, expected }) => {
    let compares = '='
    if (expected > 0) {
      compares = '>'
    } else if (expected < 0) {
      compares = '<'
    }
    it(`${a.label} ${compares} ${b.label}`, () => {
      expect(compareLocations(a, b)).toEqual(expected)
    })
  })

  describe.each([
    { a: { label: 'All' }, b: { label: 'Asian or Asian British' }, expected: -1 },
    { a: { label: 'Black or Black British' }, b: { label: 'Mixed' }, expected: -1 },
    { a: { label: 'Unknown' }, b: { label: 'All' }, expected: 1 },
    { a: { label: 'Other' }, b: { label: 'All' }, expected: 1 },
    { a: { label: 'White' }, b: { label: 'All' }, expected: 1 },
    { a: { label: 'Asian or Asian British' }, b: { label: 'Other' }, expected: -1 },
    { a: { label: 'Asian or Asian British' }, b: { label: 'Unknown' }, expected: -1 },
    { a: { label: 'Yes' }, b: { label: 'Unknown' }, expected: -1 },
    { a: { label: 'Other' }, b: { label: 'Yes' }, expected: 1 },
    { a: { label: 'Unknown' }, b: { label: 'Other' }, expected: 1 },
  ])('compareCharacteristics()', ({ a, b, expected }) => {
    let compares = '='
    if (expected > 0) {
      compares = '>'
    } else if (expected < 0) {
      compares = '<'
    }
    it(`${a.label} ${compares} ${b.label}`, () => {
      expect(compareCharacteristics(a, b)).toEqual(expected)
    })
  })

  describe.each([
    { a: { yearAndMonth: '2022-05' }, b: { yearAndMonth: '2022-06' }, expected: -1 },
    { a: { yearAndMonth: '2022-05' }, b: { yearAndMonth: '2021-05' }, expected: 1 },
    { a: { yearAndMonth: '2022-05' }, b: { yearAndMonth: '2022-05' }, expected: 0 },
  ])('compareMonths()', ({ a, b, expected }) => {
    let compares = '='
    if (expected > 0) {
      compares = '>'
    } else if (expected < 0) {
      compares = '<'
    }
    it(`${a} ${compares} ${b}`, () => {
      expect(compareMonths(a, b)).toEqual(expected)
    })
  })

  describe.each([
    ['B. Basic', 'Basic'],
    ['C. Standard', 'Standard'],
    ['D. Enhanced', 'Enhanced'],
    ['E. Enhanced 2', 'Enhanced 2'],
    // Prefixes are expected to always be "[letter]. ", so don't mangle other formats
    ['Enhanced 2', 'Enhanced 2'],
    ['A Entry', 'A Entry'],
  ])('removeSortingPrefix()', (valueWithPrefix, expectedValueWithoutPrefix) => {
    it(`Level "${valueWithPrefix}" becomes "${expectedValueWithoutPrefix}" without prefix`, () => {
      expect(removeSortingPrefix(valueWithPrefix)).toEqual(expectedValueWithoutPrefix)
    })
  })
})

describe('trends monthly data helpers', () => {
  describe('addMissingMonths()', () => {
    function expectBlankValues(actual: TrendsReportRow, expectedYearAndMonth: string) {
      expect(actual.yearAndMonth).toEqual(expectedYearAndMonth)
      expect(actual.values).toHaveLength(2)
      expect(actual.values.every(v => v === 0)).toBeTruthy()
      expect(actual.total).toEqual(0)
      expect(actual.population).toEqual(0)
    }

    it('creates blank values when no source data', () => {
      const rows: TrendsReportRow[] = []
      addMissingMonths(new Date('2021-05-09T13:12:00'), rows, 2)
      expect(rows).toHaveLength(12)
      expectBlankValues(rows[0], '2020-05')
      expectBlankValues(rows[1], '2020-06')
      expectBlankValues(rows[2], '2020-07')
      expectBlankValues(rows[3], '2020-08')
      expectBlankValues(rows[4], '2020-09')
      expectBlankValues(rows[5], '2020-10')
      expectBlankValues(rows[6], '2020-11')
      expectBlankValues(rows[7], '2020-12')
      expectBlankValues(rows[8], '2021-01')
      expectBlankValues(rows[9], '2021-02')
      expectBlankValues(rows[10], '2021-03')
      expectBlankValues(rows[11], '2021-04')
    })

    it('creates blank values when a month is missing', () => {
      const rows: TrendsReportRow[] = [
        { yearAndMonth: '2020-07', population: 1, values: [1, 2], total: 3 },
        { yearAndMonth: '2020-05', population: 1, values: [1, 2], total: 3 },
        { yearAndMonth: '2020-09', population: 1, values: [1, 2], total: 3 },
        { yearAndMonth: '2021-01', population: 1, values: [1, 2], total: 3 },
        { yearAndMonth: '2021-02', population: 1, values: [1, 2], total: 3 },
        { yearAndMonth: '2021-03', population: 1, values: [1, 2], total: 3 },
        { yearAndMonth: '2021-04', population: 1, values: [1, 2], total: 3 },
        { yearAndMonth: '2020-11', population: 1, values: [1, 2], total: 3 },
        { yearAndMonth: '2020-08', population: 1, values: [1, 2], total: 3 },
        { yearAndMonth: '2020-12', population: 1, values: [1, 2], total: 3 },
      ]
      addMissingMonths(new Date('2021-05-09T13:12:00'), rows, 2)
      expect(rows).toHaveLength(12)
      expectBlankValues(rows[1], '2020-06')
      expectBlankValues(rows[5], '2020-10')
    })
  })

  describe('removeMonthsOutsideBounds()', () => {
    it('deletes values that are outside last 12 months', () => {
      let rows: TrendsReportRow[] = [
        { yearAndMonth: '2020-07', population: 1, values: [1], total: 1 },
        { yearAndMonth: '2020-05', population: 1, values: [1], total: 1 },
        { yearAndMonth: '2020-09', population: 1, values: [1], total: 1 },
        { yearAndMonth: '2020-04', population: 1, values: [1], total: 1 }, // too early
        { yearAndMonth: '2021-01', population: 1, values: [1], total: 1 },
        { yearAndMonth: '2021-02', population: 1, values: [1], total: 1 },
        { yearAndMonth: '2021-03', population: 1, values: [1], total: 1 },
        { yearAndMonth: '2021-04', population: 1, values: [1], total: 1 },
        { yearAndMonth: '2021-05', population: 1, values: [1], total: 1 }, // current month, too late
        { yearAndMonth: '2021-06', population: 1, values: [1], total: 1 }, // next month, too late
        { yearAndMonth: '2020-11', population: 1, values: [1], total: 1 },
        { yearAndMonth: '2020-08', population: 1, values: [1], total: 1 },
        { yearAndMonth: '2020-12', population: 1, values: [1], total: 1 },
        { yearAndMonth: '2020-06', population: 1, values: [1], total: 1 },
        { yearAndMonth: '2020-10', population: 1, values: [1], total: 1 },
      ]
      rows = removeMonthsOutsideBounds(new Date('2021-05-09T13:12:00'), rows)
      expect(rows).toHaveLength(12)
      expect(rows.some(row => row.yearAndMonth <= '2020-04' && row.yearAndMonth >= '2021-05')).toBeFalsy()
    })
  })
})
