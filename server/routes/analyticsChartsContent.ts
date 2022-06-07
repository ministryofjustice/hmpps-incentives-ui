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
      'Use this chart to compare incentive levels with previous months. Information is taken from monthly averages. Is there anything that needs more exploration? Is the incentives scheme producing the levels you would like it to?',
    googleAnalyticsCategory: 'Incentive level trends',
  },
}

const guidanceIncentiveLevelsByPc =
  'Use this chart to see incentive levels for this protected characteristic and compare them to prison levels. Are there patterns or imbalances that you might want to explore further? Be aware of small numbers.'
const guidanceTrendsIncentiveLevelsByPc =
  'Use this chart to compare incentive levels for each group in this protected characteristic with previous months. Information is taken from monthly averages. Is there anything that needs more exploration? Is the incentives scheme producing levels you expect?'
const guidanceEntriesByPc =
  'This chart lets you see the balance of positive to negative entries broken down by this protected characteristic. Do these splits suggest a fair and consistent application of incentives?'
const guidanceTrendsEntriesByPc =
  'Use this chart to compare the numbers of positive, negative and total entries received by each group within this protected characteristic with previous months. What do the number of entries and the ratios tell you about incentives policy and behaviour of prisoners? Be aware of population changes.'
const guidancePrisonersWithEntriesByPc =
  'Use this chart to see the number of prisoners who have received different types of behaviour entries in this protected characteristic. Are there imbalances that need action to make sure incentives work for everyone? Be cautious about small numbers.'
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
    guidance: guidanceIncentiveLevelsByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Incentive level by age',
  },
  'incentive-levels-by-disability': {
    title: 'Percentage and number of prisoners on each incentive level by recorded disability',
    guidance: guidanceIncentiveLevelsByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Incentive level by disability',
    wideLabel: true,
  },
  'incentive-levels-by-ethnicity': {
    title: 'Percentage and number of prisoners on each incentive level by ethnicity',
    guidance: guidanceIncentiveLevelsByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Incentive level by ethnicity',
    wideLabel: true,
  },
  'incentive-levels-by-religion': {
    title: 'Percentage and number of prisoners on each incentive level by religion',
    guidance: guidanceIncentiveLevelsByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Incentive level by religion',
  },
  'incentive-levels-by-sexual-orientation': {
    title: 'Percentage and number of prisoners on each incentive level by sexual orientation',
    guidance: guidanceIncentiveLevelsByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Incentive level by sexual orientation',
  },
  'trends-incentive-levels-by-age': {
    title: 'Incentive levels by age – last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by age trends',
  },
  'trends-incentive-levels-by-disability': {
    title: 'Incentive levels by recorded disability – last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by recorded disability trends',
  },
  'trends-incentive-levels-by-ethnicity': {
    title: 'Incentive levels by ethnicity – last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by ethnicity trends',
  },
  'trends-incentive-levels-by-religion': {
    title: 'Incentive levels by religion – last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by religion trends',
  },
  'trends-incentive-levels-by-sexual-orientation': {
    title: 'Incentive levels by sexual orientation – last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by sexual orientation trends',
  },
  'entries-by-age': {
    title: 'Comparison of positive and negative behaviour entries by age – last 28 days',
    guidance: guidanceEntriesByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Comparison of behaviour entries by age',
  },
  'entries-by-disability': {
    title: 'Comparison of positive and negative behaviour entries by recorded disability – last 28 days',
    guidance: guidanceEntriesByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Comparison of behaviour entries by disability',
    wideLabel: true,
  },
  'entries-by-ethnicity': {
    title: 'Comparison of positive and negative behaviour entries by ethnicity – last 28 days',
    guidance: guidanceEntriesByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Comparison of behaviour entries by ethnicity',
    wideLabel: true,
  },
  'entries-by-religion': {
    title: 'Comparison of positive and negative behaviour entries by religion – last 28 days',
    guidance: guidanceEntriesByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Comparison of behaviour entries by religion',
  },
  'entries-by-sexual-orientation': {
    title: 'Comparison of positive and negative behaviour entries by sexual orientation – last 28 days',
    guidance: guidanceEntriesByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Comparison of behaviour entries by sexual orientation',
  },
  'trends-entries-by-age': {
    title: 'Comparison of positive and negative behaviour entries by age – last 12 months',
    guidance: guidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by age trends',
  },
  'trends-entries-by-disability': {
    title: 'Comparison of positive and negative behaviour entries by recorded disability – last 12 months',
    guidance: guidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by recorded disability trends',
  },
  'trends-entries-by-ethnicity': {
    title: 'Comparison of positive and negative behaviour entries by ethnicity – last 12 months',
    guidance: guidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by ethnicity trends',
  },
  'trends-entries-by-religion': {
    title: 'Comparison of positive and negative behaviour entries by religion – last 12 months',
    guidance: guidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by religion trends',
  },
  'trends-entries-by-sexual-orientation': {
    title: 'Comparison of positive and negative behaviour entries by sexual orientation – last 12 months',
    guidance: guidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by sexual orientation trends',
  },
  'prisoners-with-entries-by-age': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by age – last 28 days',
    guidance: guidancePrisonersWithEntriesByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Behaviour entries by age',
  },
  'prisoners-with-entries-by-disability': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by recorded disability – last 28 days',
    guidance: guidancePrisonersWithEntriesByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Behaviour entries by disability',
    wideLabel: true,
  },
  'prisoners-with-entries-by-ethnicity': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by ethnicity – last 28 days',
    guidance: guidancePrisonersWithEntriesByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Behaviour entries by ethnicity',
    wideLabel: true,
  },
  'prisoners-with-entries-by-religion': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by religion – last 28 days',
    guidance: guidancePrisonersWithEntriesByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Behaviour entries by religion',
  },
  'prisoners-with-entries-by-sexual-orientation': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by sexual orientation – last 28 days',
    guidance: guidancePrisonersWithEntriesByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Behaviour entries by sexual orientation',
  },
}
