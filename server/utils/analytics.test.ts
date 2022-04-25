import { Colour, makeChartPalette } from './analytics'

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
