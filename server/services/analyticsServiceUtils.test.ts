import {
  addMissingMonths,
  compareLocations,
  compareCharacteristics,
  compareMonths,
  removeLevelPrefix,
  removeMonthsOutsideBounds,
} from './analyticsServiceUtils'
import type { TrendsReportRow } from './analyticsServiceTypes'

describe('comparators and filters', () => {
  describe.each([
    { a: { label: 'All' }, b: { label: '1' }, expected: -1 },
    { a: { label: 'Unknown' }, b: { label: '1' }, expected: 1 },
    { a: { label: 'Unknown' }, b: { label: 'All' }, expected: 1 },
    { a: { label: 'A' }, b: { label: 'All' }, expected: 1 },
    { a: { label: '1' }, b: { label: 'A' }, expected: -1 },
    { a: { label: '1' }, b: { label: 'Unknown' }, expected: -1 },
    { a: { label: 'A' }, b: { label: '1' }, expected: 1 },
    { a: { label: 'A' }, b: { label: 'B' }, expected: -1 },
    { a: { label: 'SEG' }, b: { label: 'X' }, expected: 1 },
    { a: { label: 'RECP' }, b: { label: 'SEG' }, expected: -1 },
    { a: { label: 'RECP' }, b: { label: 'Unknown' }, expected: -1 },
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
    { a: { month: new Date('2022-05-01T12:00:00') }, b: { month: new Date('2022-06-01T12:00:00') }, expected: -1 },
    { a: { month: new Date('2022-05-01T12:00:00') }, b: { month: new Date('2021-05-01T12:00:00') }, expected: 1 },
    { a: { month: new Date('2022-05-01T12:00:00') }, b: { month: new Date('2022-05-01T12:00:00') }, expected: 0 },
  ])('compareMonths()', ({ a, b, expected }) => {
    let compares = '='
    if (expected > 0) {
      compares = '>'
    } else if (expected < 0) {
      compares = '<'
    }
    const aText = a.month.toLocaleDateString('en-GB', { year: 'numeric', month: 'numeric' })
    const bText = b.month.toLocaleDateString('en-GB', { year: 'numeric', month: 'numeric' })
    it(`${aText} ${compares} ${bText}`, () => {
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
  ])('removeLevelPrefix()', (levelWithPrefix, expectedLevelWithoutPrefix) => {
    it(`Level "${levelWithPrefix}" becomes "${expectedLevelWithoutPrefix}" without prefix`, () => {
      expect(removeLevelPrefix(levelWithPrefix)).toEqual(expectedLevelWithoutPrefix)
    })
  })
})

describe('trends monthly data helpers', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2021-05-09T13:12:00'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('addMissingMonths()', () => {
    function expectBlankValues(actual: TrendsReportRow, expectedYear: number, expectedMonth: number) {
      expect(actual.month.getFullYear()).toEqual(expectedYear)
      expect(actual.month.getMonth()).toEqual(expectedMonth) // NB: month is 0-based
      expect(actual.values).toHaveLength(2)
      expect(actual.values.every(v => v === 0)).toBeTruthy()
      expect(actual.total).toEqual(0)
      expect(actual.population).toEqual(0)
    }

    it('creates blank values when no source data', () => {
      const rows: TrendsReportRow[] = []
      addMissingMonths(rows, 2)
      expect(rows).toHaveLength(12)
      expectBlankValues(rows[0], 2020, 4)
      expectBlankValues(rows[1], 2020, 5)
      expectBlankValues(rows[2], 2020, 6)
      expectBlankValues(rows[3], 2020, 7)
      expectBlankValues(rows[4], 2020, 8)
      expectBlankValues(rows[5], 2020, 9)
      expectBlankValues(rows[6], 2020, 10)
      expectBlankValues(rows[7], 2020, 11)
      expectBlankValues(rows[8], 2021, 0)
      expectBlankValues(rows[9], 2021, 1)
      expectBlankValues(rows[10], 2021, 2)
      expectBlankValues(rows[11], 2021, 3)
    })

    it('creates blank values when a month is missing', () => {
      const rows: TrendsReportRow[] = [
        { month: new Date('2020-07-01T12:00:00'), population: 1, values: [1, 2], total: 3 },
        { month: new Date('2020-05-01T12:00:00'), population: 1, values: [1, 2], total: 3 },
        { month: new Date('2020-09-01T12:00:00'), population: 1, values: [1, 2], total: 3 },
        { month: new Date('2021-01-01T12:00:00'), population: 1, values: [1, 2], total: 3 },
        { month: new Date('2021-02-01T12:00:00'), population: 1, values: [1, 2], total: 3 },
        { month: new Date('2021-03-01T12:00:00'), population: 1, values: [1, 2], total: 3 },
        { month: new Date('2021-04-01T12:00:00'), population: 1, values: [1, 2], total: 3 },
        { month: new Date('2020-11-01T12:00:00'), population: 1, values: [1, 2], total: 3 },
        { month: new Date('2020-08-01T12:00:00'), population: 1, values: [1, 2], total: 3 },
        { month: new Date('2020-12-01T12:00:00'), population: 1, values: [1, 2], total: 3 },
      ]
      addMissingMonths(rows, 2)
      expect(rows).toHaveLength(12)
      expectBlankValues(rows[1], 2020, 5)
      expectBlankValues(rows[5], 2020, 9)
    })
  })

  describe('removeMonthsOutsideBounds()', () => {
    it('deletes values that are outside last 12 months', () => {
      let rows: TrendsReportRow[] = [
        { month: new Date('2020-07-01T12:00:00'), population: 1, values: [1], total: 1 },
        { month: new Date('2020-05-01T12:00:00'), population: 1, values: [1], total: 1 },
        { month: new Date('2020-09-01T12:00:00'), population: 1, values: [1], total: 1 },
        { month: new Date('2020-04-01T12:00:00'), population: 1, values: [1], total: 1 }, // too early
        { month: new Date('2021-01-01T12:00:00'), population: 1, values: [1], total: 1 },
        { month: new Date('2021-02-01T12:00:00'), population: 1, values: [1], total: 1 },
        { month: new Date('2021-03-01T12:00:00'), population: 1, values: [1], total: 1 },
        { month: new Date('2021-04-01T12:00:00'), population: 1, values: [1], total: 1 },
        { month: new Date('2021-05-01T12:00:00'), population: 1, values: [1], total: 1 }, // current month, too late
        { month: new Date('2021-06-01T12:00:00'), population: 1, values: [1], total: 1 }, // next month, too late
        { month: new Date('2020-11-01T12:00:00'), population: 1, values: [1], total: 1 },
        { month: new Date('2020-08-01T12:00:00'), population: 1, values: [1], total: 1 },
        { month: new Date('2020-12-01T12:00:00'), population: 1, values: [1], total: 1 },
        { month: new Date('2020-06-01T12:00:00'), population: 1, values: [1], total: 1 },
        { month: new Date('2020-10-01T12:00:00'), population: 1, values: [1], total: 1 },
      ]
      rows = removeMonthsOutsideBounds(rows)
      expect(rows).toHaveLength(12)
      expect(
        rows.some(row => {
          return (
            (row.month.getFullYear() === 2020 && row.month.getMonth() <= 3) ||
            (row.month.getFullYear() === 2021 && row.month.getMonth() >= 4)
          )
        })
      ).toBeFalsy()
    })
  })
})
