import assert from 'assert/strict'

import type { TrendsReport } from '../services/analyticsServiceTypes'

export const palette = [
  // match classes in chart-colours SCSS
  'app-chart-colour--light-blue',
  'app-chart-colour--dark-blue',
  'app-chart-colour--turquoise',
  'app-chart-colour--yellow',
  'app-chart-colour--pink',
  'app-chart-colour--mid-grey',
  // colours below are not expected to be used: presence in chart indicates unforeseen values
  'app-chart-colour--orange',
  'app-chart-colour--light-green',
] as const
export type Colour = (typeof palette)[number] | 'app-chart-colour--red' // red is the final fallback

export function makeChartPalette(columns: string[]): Colour[] {
  let availableColours = [...palette]
  const takeColour = (colour: Colour): Colour => {
    availableColours = availableColours.filter(aColour => aColour !== colour)
    return colour
  }
  return columns.map(column => {
    if (column === 'Basic' || column === 'Positive') {
      return takeColour('app-chart-colour--light-blue')
    }
    if (column === 'Standard' || column === 'Negative') {
      return takeColour('app-chart-colour--dark-blue')
    }
    if (column === 'Enhanced') {
      return takeColour('app-chart-colour--turquoise')
    }
    if (column === 'Enhanced 2' || column === 'Both') {
      return takeColour('app-chart-colour--yellow')
    }
    if (column === 'Enhanced 3') {
      return takeColour('app-chart-colour--pink')
    }
    if (column === 'None') {
      return takeColour('app-chart-colour--mid-grey')
    }
    return availableColours.shift() ?? 'app-chart-colour--red'
  })
}

export class TrendsRange {
  constructor(
    readonly max: number,
    readonly step: number,
  ) {
    assert.equal(max % step, 0, 'Range `max` must divide exactly by `step`')
  }

  get length(): number {
    return 1 + this.max / this.step
  }

  percentage(value: number): number {
    return (value / this.max) * 100
  }

  [Symbol.iterator]() {
    const { max, step } = this
    let nextValue = max
    return {
      next() {
        const value = nextValue
        nextValue -= step
        return { done: value < 0, value }
      },
    }
  }
}

export function calculateTrendsRange(report: TrendsReport): TrendsReport & { range: TrendsRange } {
  let max = 0
  // eslint-disable-next-line no-restricted-syntax
  for (const row of report.rows) {
    // eslint-disable-next-line no-restricted-syntax
    for (const value of row.values) {
      if (report.plotPercentage) {
        if (row.total !== 0) {
          max = Math.max(max, (value / row.total) * 100)
        }
      } else {
        max = Math.max(max, value)
      }
    }
    if (!report.plotPercentage) {
      max = Math.max(max, row.total)
    }
  }
  let step: number
  if (max <= 100) {
    step = 10
  } else if (max <= 500) {
    step = 50
  } else if (max <= 1000) {
    step = 100
  } else if (max <= 5000) {
    step = 500
  } else if (max <= 10000) {
    step = 1000
  } else if (max <= 50000) {
    step = 5000
  } else {
    step = 10000
  }
  max = Math.max(Math.ceil(max / step) * step, step)
  const range = new TrendsRange(max, step)
  return { ...report, range }
}
