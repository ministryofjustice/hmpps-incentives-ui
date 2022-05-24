type AnalyticsChartContent = {
  title: string
  guidance?: string
  labelColumn?: string
  googleAnalyticsCategory: string
  wideLabel?: boolean
}

export const BehaviourEntriesChartsContent: Record<string, AnalyticsChartContent> = {
  'entries-by-location': {
    title: 'Comparison of positive and negative behaviour entries by residential location – last 28 days',
    guidance:
      'This chart lets you see the balance of positive to negative entries across the prison and at residential location level. Do these splits suggest a fair and consistent application of incentives?',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Behaviour entries by wing',
  },
  'prisoners-with-entries-by-location': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by residential location – last 28 days',
    guidance:
      'Individual prisoner behaviours can give you a fuller picture. Are you happy with how many prisoners have no entries and how many have both? Positive entries can help lead to behaviour improvements.',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Prisoners with behaviour entries by wing',
  },
  'trends-entries': {
    title: 'Comparison of positive and negative behaviour entries in the establishment – last 12 months',
    guidance:
      'Use this chart to compare the numbers of positive, negative and total entries with previous months. What do the number of entries and the positive-negative ratios tell you about the incentives policy and the behaviour of prisoners? Be aware of any significant population changes.',
    googleAnalyticsCategory: 'Behaviour entry trends',
  },
}

export const IncentiveLevelsChartsContent: Record<string, AnalyticsChartContent> = {
  'incentive-levels-by-location': {
    title: 'Percentage and number of prisoners on each incentive level by residential location',
    guidance:
      'Use this chart to see incentive level splits for the prison and residential location. What does it tell you about how the incentives policy is applied, the population and possible actions for your prison?',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Incentive level by wing',
  },
  'trends-incentive-levels': {
    title: 'Incentive levels in the establishment – last 12 months',
    guidance:
      'Use this chart to compare incentive levels with previous months. Information is taken from monthly averages. Is there anything that needs explored further? Is the incentives scheme producing the levels you would like it to?',
    googleAnalyticsCategory: 'Incentive level trends',
  },
}

const guidanceTrendsIncentiveLevelsByPc =
  'Use this chart to compare incentive levels with previous months. Information is taken from monthly averages. Is there anything that needs explored further? Is the incentives scheme producing the levels you would like it to?'
export const ProtectedCharacteristicsChartsContent: Record<string, AnalyticsChartContent> = {
  'population-by-age': {
    title: 'Percentage and number of prisoners in the establishment by age',
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Population by age',
  },
  'population-by-disability': {
    title: 'Percentage and number of prisoners in the establishment by recorded disability',
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Population by disability',
    wideLabel: true,
  },
  'population-by-ethnicity': {
    title: 'Percentage and number of prisoners in the establishment by ethnicity',
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Population by ethnicity',
    wideLabel: true,
  },
  'population-by-religion': {
    title: 'Percentage and number of prisoners in the establishment by religion',
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Population by religion',
  },
  'population-by-sexual-orientation': {
    title: 'Percentage and number of prisoners in the establishment by sexual orientation',
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Population by sexual orientation',
  },
  'incentive-levels-by-age': {
    title: 'Percentage and number of prisoners on each incentive level by age',
    guidance:
      'Use this chart to see incentive levels for the main age groups and compare them to prison levels. Are there patterns that suggest the incentives policy isn’t working as well for some groups?',
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Incentive level by age',
  },
  'incentive-levels-by-disability': {
    title: 'Percentage and number of prisoners on each incentive level by recorded disability',
    guidance:
      'This chart will help you tell if there is any imbalance in incentive levels between prisoners with a disability recorded on NOMIS and those without. As the amount of missing data is high, the number of prisoners with unknown information is also provided.',
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Incentive level by disability',
    wideLabel: true,
  },
  'incentive-levels-by-ethnicity': {
    title: 'Percentage and number of prisoners on each incentive level by ethnicity',
    guidance:
      'Use this chart to see incentive levels for the main ethnicity groups and compare them to prison levels. Are there patterns or imbalances that you might want to explore further?',
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Incentive level by ethnicity',
    wideLabel: true,
  },
  'incentive-levels-by-religion': {
    title: 'Percentage and number of prisoners on each incentive level by religion',
    guidance:
      'Use this chart to see how incentive levels might vary for prisoners of different religions. Comparing to the overall prison levels should help you to spot any imbalances, but be aware of generalising from small numbers.',
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Incentive level by religion',
  },
  'incentive-levels-by-sexual-orientation': {
    title: 'Percentage and number of prisoners on each incentive level by sexual orientation',
    guidance:
      'Use this chart to see incentive levels for prisoners of different sexual orientation and compare them to the overall prison levels. Are there any patterns or imbalances that you might want to explore further?',
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Incentive level by sexual orientation',
  },
  'trends-incentive-levels-by-age': {
    title: 'Incentive levels by age - last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by age trends',
  },
  'trends-incentive-levels-by-disability': {
    title: 'Incentive levels by recorded disability - last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by recorded disability trends',
  },
  'trends-incentive-levels-by-ethnicity': {
    title: 'Incentive levels by ethnicity - last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by ethnicity trends',
  },
  'trends-incentive-levels-by-religion': {
    title: 'Incentive levels by religion - last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by religion trends',
  },
  'trends-incentive-levels-by-sexual-orientation': {
    title: 'Incentive levels by sexual orientation - last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by sexual orientation trends',
  },
  'entries-by-age': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by age - last 28 days',
    guidance:
      'Use this chart to see the number of prisoners with different types of behaviour entries for each age grouping. Are there imbalances that need action to make sure incentives work for everyone? Be cautious about small numbers.',
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Behaviour entries by age',
  },
  'entries-by-disability': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by recorded disability - last 28 days',
    guidance:
      'Use this chart to see the number of prisoners with different types of behaviour entries for each disability grouping. Are there imbalances that need action to make sure incentives work for everyone? Be cautious about small numbers.',
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Behaviour entries by disability',
    wideLabel: true,
  },
  'entries-by-ethnicity': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by ethnicity - last 28 days',
    guidance:
      'Use this chart to see the number of prisoners with different types of behaviour entries for each ethnic grouping. Are there imbalances that need action to make sure incentives work for everyone? Be cautious about small numbers.',
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Behaviour entries by ethnicity',
    wideLabel: true,
  },
  'entries-by-religion': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by religion - last 28 days',
    guidance:
      'Use this chart to see the number of prisoners with different types of behaviour entries for each religious grouping. Are there imbalances that need action to make sure incentives work for everyone? Be cautious about small numbers.',
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Behaviour entries by religion',
  },
  'entries-by-sexual-orientation': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by sexual orientation - last 28 days',
    guidance:
      'Use this chart to see the number of prisoners with different types of behaviour entries for each sexual orientation grouping. Are there imbalances that need action to make sure incentives work for everyone? Be cautious about small numbers.',
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Behaviour entries by sexual orientation',
  },
}
