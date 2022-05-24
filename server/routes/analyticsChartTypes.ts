export const chartIds = [
  // behaviour entries page
  'entries-by-location',
  'prisoners-with-entries-by-location',
  'trends-entries',

  // incentive levels page
  'incentive-levels-by-location',
  'trends-incentive-levels',

  // protected characteristics pages
  'population-by-age',
  'population-by-disability',
  'population-by-ethnicity',
  'population-by-religion',
  'population-by-sexual-orientation',
  'incentive-levels-by-age',
  'incentive-levels-by-disability',
  'incentive-levels-by-ethnicity',
  'incentive-levels-by-religion',
  'incentive-levels-by-sexual-orientation',
  'trends-entries-by-age',
  'trends-entries-by-disability',
  'trends-entries-by-ethnicity',
  'trends-entries-by-religion',
  'trends-entries-by-sexual-orientation',
  'entries-by-age',
  'entries-by-disability',
  'entries-by-ethnicity',
  'entries-by-religion',
  'entries-by-sexual-orientation',
] as const

export type ChartId = typeof chartIds[number]
