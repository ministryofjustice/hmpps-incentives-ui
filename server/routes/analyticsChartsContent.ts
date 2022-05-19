type AnalyticsChartContent = {
  title: string
  guidance?: string
  labelColumn: string
  graphGoogleAnalyticsCategory: string
  wideLabel?: boolean
}

// eslint-disable-next-line import/prefer-default-export
export const ProtectedCharacteristicsChartsContent: Record<string, AnalyticsChartContent> = {
  'population-by-age': {
    title: 'Percentage and number of prisoners in the establishment by age',
    labelColumn: 'Age',
    graphGoogleAnalyticsCategory: 'Population by age',
  },
  'population-by-disability': {
    title: 'Percentage and number of prisoners in the establishment by recorded disability',
    labelColumn: 'Disability',
    graphGoogleAnalyticsCategory: 'Population by disability',
    wideLabel: true,
  },
  'population-by-ethnicity': {
    title: 'Percentage and number of prisoners in the establishment by ethnicity',
    labelColumn: 'Ethnicity',
    graphGoogleAnalyticsCategory: 'Population by ethnicity',
    wideLabel: true,
  },
  'population-by-religion': {
    title: 'Percentage and number of prisoners in the establishment by religion',
    labelColumn: 'Religion',
    graphGoogleAnalyticsCategory: 'Population by religion',
  },
  'population-by-sexual-orientation': {
    title: 'Percentage and number of prisoners in the establishment by sexual orientation',
    labelColumn: 'Sexual orientation',
    graphGoogleAnalyticsCategory: 'Population by sexual orientation',
  },
  'incentive-levels-by-age': {
    title: 'Percentage and number of prisoners on each incentive level by age',
    guidance:
      'Use this chart to see incentive levels for the main age groups and compare them to prison levels. Are there patterns that suggest the incentives policy isn’t working as well for some groups?',
    labelColumn: 'Age',
    graphGoogleAnalyticsCategory: 'Incentive level by age',
  },
  'incentive-levels-by-disability': {
    title: 'Percentage and number of prisoners on each incentive level by recorded disability',
    guidance:
      'This chart will help you tell if there is any imbalance in incentive levels between prisoners with a disability recorded on NOMIS and those without. As the amount of missing data is high, the number of prisoners with unknown information is also provided.',
    labelColumn: 'Disability',
    graphGoogleAnalyticsCategory: 'Incentive level by disability',
    wideLabel: true,
  },
  'incentive-levels-by-ethnicity': {
    title: 'Percentage and number of prisoners on each incentive level by ethnicity',
    guidance:
      'Use this chart to see incentive levels for the main ethnicity groups and compare them to prison levels. Are there patterns or imbalances that you might want to explore further?',
    labelColumn: 'Ethnicity',
    graphGoogleAnalyticsCategory: 'Incentive level by ethnicity',
    wideLabel: true,
  },
  'incentive-levels-by-religion': {
    title: 'Percentage and number of prisoners on each incentive level by religion',
    guidance:
      'Use this chart to see how incentive levels might vary for prisoners of different religions. Comparing to the overall prison levels should help you to spot any imbalances, but be aware of generalising from small numbers.',
    labelColumn: 'Religion',
    graphGoogleAnalyticsCategory: 'Incentive level by religion',
  },
  'incentive-levels-by-sexual-orientation': {
    title: 'Percentage and number of prisoners on each incentive level by sexual orientation',
    guidance:
      'Use this chart to see incentive levels for prisoners of different sexual orientation and compare them to the overall prison levels. Are there any patterns or imbalances that you might want to explore further?',
    labelColumn: 'Sexual orientation',
    graphGoogleAnalyticsCategory: 'Incentive level by sexual orientation',
  },
  'entries-by-age': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by age - last 28 days',
    guidance:
      'Use this chart to see the number of prisoners with different types of behaviour entries for each age grouping. Are there imbalances that need action to make sure incentives work for everyone? Be cautious about small numbers.',
    labelColumn: 'Age',
    graphGoogleAnalyticsCategory: 'Behaviour entries by age',
  },
  'entries-by-disability': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by recorded disability - last 28 days',
    guidance:
      'Use this chart to see the number of prisoners with different types of behaviour entries for each disability grouping. Are there imbalances that need action to make sure incentives work for everyone? Be cautious about small numbers.',
    labelColumn: 'Disability',
    graphGoogleAnalyticsCategory: 'Behaviour entries by disability',
    wideLabel: true,
  },
  'entries-by-ethnicity': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by ethnicity - last 28 days',
    guidance:
      'Use this chart to see the number of prisoners with different types of behaviour entries for each ethnic grouping. Are there imbalances that need action to make sure incentives work for everyone? Be cautious about small numbers.',
    labelColumn: 'Ethnicity',
    graphGoogleAnalyticsCategory: 'Behaviour entries by ethnicity',
    wideLabel: true,
  },
  'entries-by-religion': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by religion - last 28 days',
    guidance:
      'Use this chart to see the number of prisoners with different types of behaviour entries for each religious grouping. Are there imbalances that need action to make sure incentives work for everyone? Be cautious about small numbers.',
    labelColumn: 'Religion',
    graphGoogleAnalyticsCategory: 'Behaviour entries by religion',
  },
  'entries-by-sexual-orientation': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by sexual orientation - last 28 days',
    guidance:
      'Use this chart to see the number of prisoners with different types of behaviour entries for each sexual orientation grouping. Are there imbalances that need action to make sure incentives work for everyone? Be cautious about small numbers.',
    labelColumn: 'Sexual orientation',
    graphGoogleAnalyticsCategory: 'Behaviour entries by sexual orientation',
  },
}
