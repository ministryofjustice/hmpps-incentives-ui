import { Colour, makeChartPalette, TrendsRange, calculateTrendsRange } from './analytics'
import type { TrendsReport } from '../services/analyticsServiceTypes'

describe.each([
  [
    'with typical incentive levels',
    ['Basic', 'Standard', 'Enhanced'],
    ['app-chart-colour--a', 'app-chart-colour--b', 'app-chart-colour--c'],
  ],
  [
    'with extended incentive levels',
    ['Basic', 'Standard', 'Enhanced', 'Enhanced 2'],
    ['app-chart-colour--a', 'app-chart-colour--b', 'app-chart-colour--c', 'app-chart-colour--d'],
  ],
  [
    'with a common incentive level missing',
    ['Standard', 'Enhanced', 'Enhanced 2'],
    ['app-chart-colour--b', 'app-chart-colour--c', 'app-chart-colour--d'],
  ],
  [
    'with a different incentive level missing',
    ['Basic', 'Standard', 'Enhanced 2'],
    ['app-chart-colour--a', 'app-chart-colour--b', 'app-chart-colour--d'],
  ],
  [
    'with an incorrectly named incentive level',
    ['Basic', 'Standard', 'Enhanced', 'Super enhanced'],
    ['app-chart-colour--a', 'app-chart-colour--b', 'app-chart-colour--c', 'app-chart-colour--d'],
  ],
  [
    'with an unexpected incentive level',
    ['Basic', 'Standard', 'Enhanced', 'Enhanced 2', 'Unexpected'],
    ['app-chart-colour--a', 'app-chart-colour--b', 'app-chart-colour--c', 'app-chart-colour--d', 'app-chart-colour--e'],
  ],
  [
    'with several unexpected incentive levels',
    ['Basic', 'Standard', 'Enhanced', 'Enhanced 2', 'Unexpected 1', 'Unexpected 2', 'Unexpected 3'],
    [
      'app-chart-colour--a',
      'app-chart-colour--b',
      'app-chart-colour--c',
      'app-chart-colour--d',
      'app-chart-colour--e',
      'app-chart-colour--e',
      'app-chart-colour--e',
    ],
  ],
  [
    'with behaviour entry types', // NB: types are hard-coded so variations do not require testing
    ['Positive', 'Negative'],
    ['app-chart-colour--a', 'app-chart-colour--b'],
  ],
])('chartPalette filter', (name: string, columns: string[], expectedPalette: Colour[]) => {
  it(name, () => {
    expect(makeChartPalette(columns)).toEqual(expectedPalette)
  })
})

describe('TrendsRange', () => {
  describe.each([
    {
      max: 10,
      step: 10,
      expectedLength: 2,
      expectedValues: [10, 0],
      expectedPercentages: [
        [0, 0],
        [1, 10],
        [5, 50],
        [10, 100],
      ],
    },
    {
      max: 30,
      step: 10,
      expectedLength: 4,
      expectedValues: [30, 20, 10, 0],
      expectedPercentages: [
        [0, 0],
        [10, 33.3333],
        [30, 100],
      ],
    },
    {
      max: 400,
      step: 100,
      expectedLength: 5,
      expectedValues: [400, 300, 200, 100, 0],
      expectedPercentages: [
        [0, 0],
        [50, 12.5],
        [400, 100],
      ],
    },
  ])('is an iterable', ({ max, step, expectedLength, expectedValues, expectedPercentages }) => {
    let range: TrendsRange
    beforeEach(() => {
      range = new TrendsRange(max, step)
    })

    it(`new TrendsRange(${max}, ${step}) has expected length`, () => {
      expect(range).toHaveLength(expectedLength)
    })

    it(`new TrendsRange(${max}, ${step}) has expected values`, () => {
      const values = []
      // eslint-disable-next-line no-restricted-syntax
      for (const value of range) {
        values.push(value)
      }
      expect(values).toEqual(expectedValues)
    })

    it(`new TrendsRange(${max}, ${step}) calculates value percentages`, () => {
      expectedPercentages.forEach(([value, expectedPercentage]) => {
        expect(range.percentage(value)).toBeCloseTo(expectedPercentage)
      })
    })
  })
})

describe('calculateTrendsRange filter', () => {
  describe.each([
    {
      name: 'no values',
      rowValues: [[]],
      expectedStep: 10,
      expectedMaximum: 10,
      expectedMaximumPercentage: 10,
    },
    {
      name: 'a total of 0',
      rowValues: [
        [0, 0],
        [0, 0],
      ],
      expectedStep: 10,
      expectedMaximum: 10,
      expectedMaximumPercentage: 10,
    },
    {
      name: 'values in one row',
      rowValues: [[1, 2, 3, 95, 6, 70]],
      expectedStep: 50,
      expectedMaximum: 200,
      expectedMaximumPercentage: 60, // 95/177 ~53.7%
    },
    {
      name: 'rows with one value',
      rowValues: [[10], [10], [10], [10], [10], [10], [10]],
      expectedStep: 10,
      expectedMaximum: 10,
      expectedMaximumPercentage: 100, // 10/10 100%
    },
    {
      name: 'larger values in one row',
      rowValues: [[100, 151]],
      expectedStep: 50,
      expectedMaximum: 300,
      expectedMaximumPercentage: 70, // 151/251 ~60.2%
    },
    {
      name: 'rows with one larger value',
      rowValues: [[10], [2], [40], [0], [145]],
      expectedStep: 50,
      expectedMaximum: 150,
      expectedMaximumPercentage: 100,
    },
    {
      name: 'medium values',
      rowValues: [[100, 200, 300, 1_499]],
      expectedStep: 500,
      expectedMaximum: 2_500,
      expectedMaximumPercentage: 80, // 1499/2099 ~71.4%
    },
    {
      name: 'large values',
      rowValues: [[1_501, 100, 0, 1]],
      expectedStep: 500,
      expectedMaximum: 2_000,
      expectedMaximumPercentage: 100, // 1501/1602 ~93.7%
    },
    {
      name: 'larger values',
      rowValues: [[2_000, 3_001, 14_999]],
      expectedStep: 5000,
      expectedMaximum: 20_000,
      expectedMaximumPercentage: 80, // 14999/20000 ~75.0%
    },
    {
      name: 'very large values',
      rowValues: [[21_500, 1, 100_000]],
      expectedStep: 10_000,
      expectedMaximum: 130_000,
      expectedMaximumPercentage: 90, // 100000/121501 ~82.30%
    },
  ])('calculates the value range', ({ name, rowValues, expectedStep, expectedMaximum, expectedMaximumPercentage }) => {
    let report: TrendsReport
    beforeEach(() => {
      report = {
        columns: undefined,
        dataSource: undefined,
        lastUpdated: undefined,
        rows: rowValues.map(values => {
          return {
            values,
            total: values.reduce((v1, v2) => v1 + v2, 0),
            yearAndMonth: undefined,
            population: undefined,
          }
        }),
        plotPercentage: false,
        verticalAxisTitle: undefined,
        populationIsTotal: false,
        monthlyTotalName: undefined,
      }
    })

    it(`when plotting absolute numbers given ${name}`, () => {
      const reportWithRange = calculateTrendsRange(report)
      expect(reportWithRange.range.max).toEqual<number>(expectedMaximum)
      expect(reportWithRange.range.step).toEqual<number>(expectedStep)
    })

    it(`when plotting percentages given ${name}`, () => {
      report.plotPercentage = true
      const reportWithRange = calculateTrendsRange(report)
      expect(reportWithRange.range.max).toEqual<number>(expectedMaximumPercentage)
    })
  })
})
