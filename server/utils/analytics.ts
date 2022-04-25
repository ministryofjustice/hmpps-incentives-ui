export const palette = [
  // match classes in chart-colours SCSS
  'app-chart-colour--a',
  'app-chart-colour--b',
  'app-chart-colour--c',
  'app-chart-colour--d',
  'app-chart-colour--e',
] as const
export type Colour = typeof palette[number]

export function makeChartPalette(columns: string[]): Colour[] {
  let availableColours = [...palette]
  const takeColour = (colour: Colour): Colour => {
    availableColours = availableColours.filter(aColour => aColour !== colour)
    return colour
  }
  return columns.map(column => {
    if (column === 'Basic' || column === 'Positive') {
      return takeColour('app-chart-colour--a')
    }
    if (column === 'Standard' || column === 'Negative') {
      return takeColour('app-chart-colour--b')
    }
    if (column === 'Enhanced') {
      return takeColour('app-chart-colour--c')
    }
    if (column === 'Enhanced 2') {
      return takeColour('app-chart-colour--d')
    }
    return availableColours.shift() ?? 'app-chart-colour--e'
  })
}
