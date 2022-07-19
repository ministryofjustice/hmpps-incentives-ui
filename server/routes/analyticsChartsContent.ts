export type AnalyticsChartContent = {
  title: string
  guidance?: string
  labelColumn?: string
  googleAnalyticsCategory: string
  labelColumnWidth?: 'wide' | 'extra-wide'
}

export const BehaviourEntriesChartsContent: Record<string, AnalyticsChartContent> = {
  'entries-by-location': {
    title: 'Comparison of positive and negative behaviour entries by residential location – last 28 days',
    guidance:
      'This chart lets you see the balance of positive to negative entries across the prison and at residential location level. Do these splits suggest a fair and consistent application of incentives?',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Behaviour entries by wing (Prison)',
  },
  'prisoners-with-entries-by-location': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by residential location – last 28 days',
    guidance:
      'Individual prisoner behaviours can give you a fuller picture. Are you happy with how many prisoners have no entries and how many have both? Positive entries can help lead to behaviour improvements.',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Prisoners with behaviour entries by wing (Prison)',
  },
  'trends-entries': {
    title: 'Comparison of positive and negative behaviour entries in the establishment – last 12 months',
    guidance:
      'Use this chart to compare the numbers of positive, negative and total entries with previous months. What do the number of entries and the positive-negative ratios tell you about the incentives policy and the behaviour of prisoners? Be aware of any significant population changes.',
    googleAnalyticsCategory: 'Behaviour entry trends (Prison)',
  },
}

export const IncentiveLevelsChartsContent: Record<string, AnalyticsChartContent> = {
  'incentive-levels-by-location': {
    title: 'Percentage and number of prisoners on each incentive level by residential location',
    guidance:
      'Use this chart to see incentive level splits for the prison and residential location. What does it tell you about how the incentives policy is applied, the population and possible actions for your prison?',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Incentive level by wing (Prison)',
  },
  'trends-incentive-levels': {
    title: 'Incentive levels in the establishment – last 12 months',
    guidance:
      'Use this chart to compare incentive levels with previous months. Information is taken from monthly averages. Is there anything that needs more exploration? Is the incentives scheme producing the levels you would like it to?',
    googleAnalyticsCategory: 'Incentive level trends (Prison)',
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
    googleAnalyticsCategory: 'Population by age (Prison)',
  },
  'population-by-disability': {
    title: 'Percentage and number of prisoners in the establishment by recorded disability',
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Population by disability (Prison)',
    labelColumnWidth: 'wide',
  },
  'population-by-ethnicity': {
    title: 'Percentage and number of prisoners in the establishment by ethnicity',
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Population by ethnicity (Prison)',
    labelColumnWidth: 'wide',
  },
  'population-by-religion': {
    title: 'Percentage and number of prisoners in the establishment by religion',
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Population by religion (Prison)',
  },
  'population-by-sexual-orientation': {
    title: 'Percentage and number of prisoners in the establishment by sexual orientation',
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Population by sexual orientation (Prison)',
  },
  'incentive-levels-by-age': {
    title: 'Percentage and number of prisoners on each incentive level by age',
    guidance: guidanceIncentiveLevelsByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Incentive level by age (Prison)',
  },
  'incentive-levels-by-disability': {
    title: 'Percentage and number of prisoners on each incentive level by recorded disability',
    guidance: guidanceIncentiveLevelsByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Incentive level by disability (Prison)',
    labelColumnWidth: 'wide',
  },
  'incentive-levels-by-ethnicity': {
    title: 'Percentage and number of prisoners on each incentive level by ethnicity',
    guidance: guidanceIncentiveLevelsByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Incentive level by ethnicity (Prison)',
    labelColumnWidth: 'wide',
  },
  'incentive-levels-by-religion': {
    title: 'Percentage and number of prisoners on each incentive level by religion',
    guidance: guidanceIncentiveLevelsByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Incentive level by religion (Prison)',
  },
  'incentive-levels-by-sexual-orientation': {
    title: 'Percentage and number of prisoners on each incentive level by sexual orientation',
    guidance: guidanceIncentiveLevelsByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Incentive level by sexual orientation (Prison)',
  },
  'trends-incentive-levels-by-age': {
    title: 'Incentive levels by age – last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by age trends (Prison)',
  },
  'trends-incentive-levels-by-disability': {
    title: 'Incentive levels by recorded disability – last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by recorded disability trends (Prison)',
  },
  'trends-incentive-levels-by-ethnicity': {
    title: 'Incentive levels by ethnicity – last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by ethnicity trends (Prison)',
  },
  'trends-incentive-levels-by-religion': {
    title: 'Incentive levels by religion – last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by religion trends (Prison)',
  },
  'trends-incentive-levels-by-sexual-orientation': {
    title: 'Incentive levels by sexual orientation – last 12 months',
    guidance: guidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by sexual orientation trends (Prison)',
  },
  'entries-by-age': {
    title: 'Comparison of positive and negative behaviour entries by age – last 28 days',
    guidance: guidanceEntriesByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Comparison of behaviour entries by age (Prison)',
  },
  'entries-by-disability': {
    title: 'Comparison of positive and negative behaviour entries by recorded disability – last 28 days',
    guidance: guidanceEntriesByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Comparison of behaviour entries by disability (Prison)',
    labelColumnWidth: 'wide',
  },
  'entries-by-ethnicity': {
    title: 'Comparison of positive and negative behaviour entries by ethnicity – last 28 days',
    guidance: guidanceEntriesByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Comparison of behaviour entries by ethnicity (Prison)',
    labelColumnWidth: 'wide',
  },
  'entries-by-religion': {
    title: 'Comparison of positive and negative behaviour entries by religion – last 28 days',
    guidance: guidanceEntriesByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Comparison of behaviour entries by religion (Prison)',
  },
  'entries-by-sexual-orientation': {
    title: 'Comparison of positive and negative behaviour entries by sexual orientation – last 28 days',
    guidance: guidanceEntriesByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Comparison of behaviour entries by sexual orientation (Prison)',
  },
  'trends-entries-by-age': {
    title: 'Comparison of positive and negative behaviour entries by age – last 12 months',
    guidance: guidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by age trends (Prison)',
  },
  'trends-entries-by-disability': {
    title: 'Comparison of positive and negative behaviour entries by recorded disability – last 12 months',
    guidance: guidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by recorded disability trends (Prison)',
  },
  'trends-entries-by-ethnicity': {
    title: 'Comparison of positive and negative behaviour entries by ethnicity – last 12 months',
    guidance: guidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by ethnicity trends (Prison)',
  },
  'trends-entries-by-religion': {
    title: 'Comparison of positive and negative behaviour entries by religion – last 12 months',
    guidance: guidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by religion trends (Prison)',
  },
  'trends-entries-by-sexual-orientation': {
    title: 'Comparison of positive and negative behaviour entries by sexual orientation – last 12 months',
    guidance: guidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by sexual orientation trends (Prison)',
  },
  'prisoners-with-entries-by-age': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by age – last 28 days',
    guidance: guidancePrisonersWithEntriesByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Behaviour entries by age (Prison)',
  },
  'prisoners-with-entries-by-disability': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by recorded disability – last 28 days',
    guidance: guidancePrisonersWithEntriesByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Behaviour entries by disability (Prison)',
    labelColumnWidth: 'wide',
  },
  'prisoners-with-entries-by-ethnicity': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by ethnicity – last 28 days',
    guidance: guidancePrisonersWithEntriesByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Behaviour entries by ethnicity (Prison)',
    labelColumnWidth: 'wide',
  },
  'prisoners-with-entries-by-religion': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by religion – last 28 days',
    guidance: guidancePrisonersWithEntriesByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Behaviour entries by religion (Prison)',
  },
  'prisoners-with-entries-by-sexual-orientation': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by sexual orientation – last 28 days',
    guidance: guidancePrisonersWithEntriesByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Behaviour entries by sexual orientation (Prison)',
  },
}

export const RegionalIncentiveLevelsChartsContent: Record<string, AnalyticsChartContent> = {
  'incentive-levels-by-location': {
    title: 'Percentage and number of prisoners on each incentive level by establishment',
    guidance:
      'Use this chart to see incentive level splits for individual establishments. What does it tell you about how the incentives policy is applied? Are there any opportunities to share practice?',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Incentive level by establishment (Group)',
  },
  'trends-incentive-levels': {
    title: 'Incentive levels in the prison group – last 12 months',
    guidance:
      'This chart tells you the split of incentive levels across the whole prison group - it can be used as a guide to start asking questions. Be aware that patterns for individual establishments could be masked - these can be viewed separately.',
    googleAnalyticsCategory: 'Incentive level trends (Group)',
  },
}

export const RegionalBehaviourEntriesChartsContent: Record<string, AnalyticsChartContent> = {
  'entries-by-location': {
    title: 'Comparison of positive and negative behaviour entries by establishment – last 28 days',
    guidance:
      'This chart lets you see the balance of positive to negative entries in each establishment. Do these proportions meet your expectations for the incentives policies?',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Behaviour entries by establishment (Group)',
  },
  'prisoners-with-entries-by-location': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by establishment – last 28 days',
    guidance:
      'Individual prisoner behaviours can give a fuller picture of the establishment. Are you happy with how many prisoners have no behaviour entries, and what all these numbers suggest about the incentives policy application?',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Prisoners with behaviour entries by establishment (Group)',
  },
  'trends-entries': {
    title: 'Comparison of positive and negative behaviour entries in the prison group – last 12 months',
    guidance:
      'This chart tells you the split of behaviour entries across the whole prison group for general information. Be aware that ratios for individual establishments could be masked - these can be viewed separately.',
    googleAnalyticsCategory: 'Behaviour entry trends (Group)',
  },
}

const regionalGuidanceIncentiveLevelsByPc =
  'Use this chart to see incentive levels of this protected characteristic across the whole prison group. The numbers may be large enough to show imbalances, although these could differ in individual establishments. You might want to explore further at prison level.'
const regionalGuidanceTrendsIncentiveLevelsByPc =
  'This chart shows prison group incentive levels for each group in this protected characteristic over 12 months. It can be used as a guide to prompt discussions. Be aware that patterns for individual establishments could be masked - these can be viewed separately.'
const regionalGuidanceEntriesByPc =
  'This chart lets you see the balance of positive to negative entries broken down by this protected characteristic across the prison group. These ratios could differ in individual establishments. You might want to explore further at prison level.'
const regionalGuidanceTrendsEntriesByPc =
  'This chart tells you the level split of behaviour entries for each group in this protected characteristic over 12 months. Be aware that this is at prison group level, so imbalances in individual establishments could be masked - these can be viewed separately.'
const regionalGuidancePrisonersWithEntriesByPc =
  'This chart shows the number of prisoners receiving different types of behaviour entries in this protected characteristic across the prison group. Be aware any imbalances shown could differ in individual establishments. You might want to explore further at prison level.'
export const RegionalProtectedCharacteristicsChartsContent: Record<string, AnalyticsChartContent> = {
  'population-by-age': {
    title: 'Percentage and number of prisoners by age',
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Population by age (Group)',
  },
  'population-by-disability': {
    title: 'Percentage and number of prisoners by recorded disability',
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Population by disability (Group)',
    labelColumnWidth: 'wide',
  },
  'population-by-ethnicity': {
    title: 'Percentage and number of prisoners by ethnicity',
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Population by ethnicity (Group)',
    labelColumnWidth: 'wide',
  },
  'population-by-religion': {
    title: 'Percentage and number of prisoners by religion',
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Population by religion (Group)',
  },
  'population-by-sexual-orientation': {
    title: 'Percentage and number of prisoners by sexual orientation',
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Population by sexual orientation (Group)',
  },
  'incentive-levels-by-age': {
    title: 'Percentage and number of prisoners on each incentive level by age',
    guidance: regionalGuidanceIncentiveLevelsByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Incentive level by age (Group)',
  },
  'incentive-levels-by-disability': {
    title: 'Percentage and number of prisoners on each incentive level by recorded disability',
    guidance: regionalGuidanceIncentiveLevelsByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Incentive level by disability (Group)',
    labelColumnWidth: 'wide',
  },
  'incentive-levels-by-ethnicity': {
    title: 'Percentage and number of prisoners on each incentive level by ethnicity',
    guidance: regionalGuidanceIncentiveLevelsByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Incentive level by ethnicity (Group)',
    labelColumnWidth: 'wide',
  },
  'incentive-levels-by-religion': {
    title: 'Percentage and number of prisoners on each incentive level by religion',
    guidance: regionalGuidanceIncentiveLevelsByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Incentive level by religion (Group)',
  },
  'incentive-levels-by-sexual-orientation': {
    title: 'Percentage and number of prisoners on each incentive level by sexual orientation',
    guidance: regionalGuidanceIncentiveLevelsByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Incentive level by sexual orientation (Group)',
  },
  'trends-incentive-levels-by-age': {
    title: 'Incentive levels by age – last 12 months',
    guidance: regionalGuidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by age trends (Group)',
  },
  'trends-incentive-levels-by-disability': {
    title: 'Incentive levels by recorded disability – last 12 months',
    guidance: regionalGuidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by recorded disability trends (Group)',
  },
  'trends-incentive-levels-by-ethnicity': {
    title: 'Incentive levels by ethnicity – last 12 months',
    guidance: regionalGuidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by ethnicity trends (Group)',
  },
  'trends-incentive-levels-by-religion': {
    title: 'Incentive levels by religion – last 12 months',
    guidance: regionalGuidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by religion trends (Group)',
  },
  'trends-incentive-levels-by-sexual-orientation': {
    title: 'Incentive levels by sexual orientation – last 12 months',
    guidance: regionalGuidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by sexual orientation trends (Group)',
  },
  'entries-by-age': {
    title: 'Comparison of positive and negative behaviour entries by age – last 28 days',
    guidance: regionalGuidanceEntriesByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Comparison of behaviour entries by age (Group)',
  },
  'entries-by-disability': {
    title: 'Comparison of positive and negative behaviour entries by recorded disability – last 28 days',
    guidance: regionalGuidanceEntriesByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Comparison of behaviour entries by disability (Group)',
    labelColumnWidth: 'wide',
  },
  'entries-by-ethnicity': {
    title: 'Comparison of positive and negative behaviour entries by ethnicity – last 28 days',
    guidance: regionalGuidanceEntriesByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Comparison of behaviour entries by ethnicity (Group)',
    labelColumnWidth: 'wide',
  },
  'entries-by-religion': {
    title: 'Comparison of positive and negative behaviour entries by religion – last 28 days',
    guidance: regionalGuidanceEntriesByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Comparison of behaviour entries by religion (Group)',
  },
  'entries-by-sexual-orientation': {
    title: 'Comparison of positive and negative behaviour entries by sexual orientation – last 28 days',
    guidance: regionalGuidanceEntriesByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Comparison of behaviour entries by sexual orientation (Group)',
  },
  'trends-entries-by-age': {
    title: 'Comparison of positive and negative behaviour entries by age – last 12 months',
    guidance: regionalGuidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by age trends (Group)',
  },
  'trends-entries-by-disability': {
    title: 'Comparison of positive and negative behaviour entries by recorded disability – last 12 months',
    guidance: regionalGuidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by recorded disability trends (Group)',
  },
  'trends-entries-by-ethnicity': {
    title: 'Comparison of positive and negative behaviour entries by ethnicity – last 12 months',
    guidance: regionalGuidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by ethnicity trends (Group)',
  },
  'trends-entries-by-religion': {
    title: 'Comparison of positive and negative behaviour entries by religion – last 12 months',
    guidance: regionalGuidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by religion trends (Group)',
  },
  'trends-entries-by-sexual-orientation': {
    title: 'Comparison of positive and negative behaviour entries by sexual orientation – last 12 months',
    guidance: regionalGuidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by sexual orientation trends (Group)',
  },
  'prisoners-with-entries-by-age': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by age – last 28 days',
    guidance: regionalGuidancePrisonersWithEntriesByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Behaviour entries by age (Group)',
  },
  'prisoners-with-entries-by-disability': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by recorded disability – last 28 days',
    guidance: regionalGuidancePrisonersWithEntriesByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Behaviour entries by disability (Group)',
    labelColumnWidth: 'wide',
  },
  'prisoners-with-entries-by-ethnicity': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by ethnicity – last 28 days',
    guidance: regionalGuidancePrisonersWithEntriesByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Behaviour entries by ethnicity (Group)',
    labelColumnWidth: 'wide',
  },
  'prisoners-with-entries-by-religion': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by religion – last 28 days',
    guidance: regionalGuidancePrisonersWithEntriesByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Behaviour entries by religion (Group)',
  },
  'prisoners-with-entries-by-sexual-orientation': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by sexual orientation – last 28 days',
    guidance: regionalGuidancePrisonersWithEntriesByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Behaviour entries by sexual orientation (Group)',
  },
}

export const NationalIncentiveLevelsChartsContent: Record<string, AnalyticsChartContent> = {
  'incentive-levels-by-location': {
    title: 'Percentage and number of prisoners on each incentive level by prison group',
    guidance:
      'Use this chart to see incentive level splits nationally and for each prison group. This will give you information for general patterns across the prison service, but it could highlight where you might want to explore further.',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Incentive level by prison group (National)',
  },
  'trends-incentive-levels': {
    title: 'National incentive levels – last 12 months',
    guidance:
      'This chart tells you the split of incentive levels nationally across the whole prison service in the last 12 months. It can be used as a guide to start asking questions, and to inform where you might want to look deeper.',
    googleAnalyticsCategory: 'Incentive level trends (National)',
  },
}

export const NationalBehaviourEntriesChartsContent: Record<string, AnalyticsChartContent> = {
  'entries-by-location': {
    title: 'Comparison of positive and negative behaviour entries by prison group – last 28 days',
    guidance:
      'This chart lets you see the balance of positive to negative entries nationally and at prison group level, for general information.',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Behaviour entries by prison group (National)',
  },
  'prisoners-with-entries-by-location': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by prison group – last 28 days',
    guidance:
      'This chart shows you the breakdown of prisoners receiving each behaviour entry type, nationally and at prison group level. Do these numbers suggest anything about how incentive policies are generally being applied?',
    labelColumn: 'Location',
    googleAnalyticsCategory: 'Prisoners with behaviour entries by prison group (National)',
  },
  'trends-entries': {
    title: 'Comparison of positive and negative behaviour entries at national level – last 12 months',
    guidance:
      'This chart shows you the split of behaviour entries nationally, for general information. Be aware that ratios for individual establishments and prison groups could be quite different.',
    googleAnalyticsCategory: 'Behaviour entry trends (National)',
  },
}

const nationalGuidanceIncentiveLevelsByPc =
  'This chart shows incentive level splits of this protected characteristic at a national level. The numbers may be large enough to show imbalances, although these could differ in prison groups and individual establishments.'
const nationalGuidanceTrendsIncentiveLevelsByPc =
  'This chart shows incentive levels for each group in this protected characteristic over 12 months. Be aware that national patterns could mask individual establishment and prison group data.'
const nationalGuidanceEntriesByPc =
  'This chart lets you see the balance of positive to negative entries broken down by this protected characteristic at a national level. These ratios could differ in individual establishments and groups.'
const nationalGuidanceTrendsEntriesByPc =
  'This chart tells you the split of behaviour entries for each group in this protected characteristic over 12 months. Be aware that national patterns could mask individual establishment and prison group data.'
const nationalGuidancePrisonersWithEntriesByPc =
  'This chart shows the number of prisoners receiving different types of behaviour entries in this protected characteristic at a national level. Be aware any national imbalances shown could differ in individual establishments and prison groups.'
export const NationalProtectedCharacteristicsChartsContent: Record<string, AnalyticsChartContent> = {
  'population-by-age': {
    title: 'Percentage and number of prisoners by age',
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Population by age (National)',
  },
  'population-by-disability': {
    title: 'Percentage and number of prisoners by recorded disability',
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Population by disability (National)',
    labelColumnWidth: 'wide',
  },
  'population-by-ethnicity': {
    title: 'Percentage and number of prisoners by ethnicity',
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Population by ethnicity (National)',
    labelColumnWidth: 'wide',
  },
  'population-by-religion': {
    title: 'Percentage and number of prisoners by religion',
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Population by religion (National)',
  },
  'population-by-sexual-orientation': {
    title: 'Percentage and number of prisoners by sexual orientation',
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Population by sexual orientation (National)',
  },
  'incentive-levels-by-age': {
    title: 'Percentage and number of prisoners on each incentive level by age',
    guidance: nationalGuidanceIncentiveLevelsByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Incentive level by age (National)',
  },
  'incentive-levels-by-disability': {
    title: 'Percentage and number of prisoners on each incentive level by recorded disability',
    guidance: nationalGuidanceIncentiveLevelsByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Incentive level by disability (National)',
    labelColumnWidth: 'wide',
  },
  'incentive-levels-by-ethnicity': {
    title: 'Percentage and number of prisoners on each incentive level by ethnicity',
    guidance: nationalGuidanceIncentiveLevelsByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Incentive level by ethnicity (National)',
    labelColumnWidth: 'wide',
  },
  'incentive-levels-by-religion': {
    title: 'Percentage and number of prisoners on each incentive level by religion',
    guidance: nationalGuidanceIncentiveLevelsByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Incentive level by religion (National)',
  },
  'incentive-levels-by-sexual-orientation': {
    title: 'Percentage and number of prisoners on each incentive level by sexual orientation',
    guidance: nationalGuidanceIncentiveLevelsByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Incentive level by sexual orientation (National)',
  },
  'trends-incentive-levels-by-age': {
    title: 'Incentive levels by age – last 12 months',
    guidance: nationalGuidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by age trends (National)',
  },
  'trends-incentive-levels-by-disability': {
    title: 'Incentive levels by recorded disability – last 12 months',
    guidance: nationalGuidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by recorded disability trends (National)',
  },
  'trends-incentive-levels-by-ethnicity': {
    title: 'Incentive levels by ethnicity – last 12 months',
    guidance: nationalGuidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by ethnicity trends (National)',
  },
  'trends-incentive-levels-by-religion': {
    title: 'Incentive levels by religion – last 12 months',
    guidance: nationalGuidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by religion trends (National)',
  },
  'trends-incentive-levels-by-sexual-orientation': {
    title: 'Incentive levels by sexual orientation – last 12 months',
    guidance: nationalGuidanceTrendsIncentiveLevelsByPc,
    googleAnalyticsCategory: 'Incentive level by sexual orientation trends (National)',
  },
  'entries-by-age': {
    title: 'Comparison of positive and negative behaviour entries by age – last 28 days',
    guidance: nationalGuidanceEntriesByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Comparison of behaviour entries by age (National)',
  },
  'entries-by-disability': {
    title: 'Comparison of positive and negative behaviour entries by recorded disability – last 28 days',
    guidance: nationalGuidanceEntriesByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Comparison of behaviour entries by disability (National)',
    labelColumnWidth: 'wide',
  },
  'entries-by-ethnicity': {
    title: 'Comparison of positive and negative behaviour entries by ethnicity – last 28 days',
    guidance: nationalGuidanceEntriesByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Comparison of behaviour entries by ethnicity (National)',
    labelColumnWidth: 'wide',
  },
  'entries-by-religion': {
    title: 'Comparison of positive and negative behaviour entries by religion – last 28 days',
    guidance: nationalGuidanceEntriesByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Comparison of behaviour entries by religion (National)',
  },
  'entries-by-sexual-orientation': {
    title: 'Comparison of positive and negative behaviour entries by sexual orientation – last 28 days',
    guidance: nationalGuidanceEntriesByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Comparison of behaviour entries by sexual orientation (National)',
  },
  'trends-entries-by-age': {
    title: 'Comparison of positive and negative behaviour entries by age – last 12 months',
    guidance: nationalGuidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by age trends (National)',
  },
  'trends-entries-by-disability': {
    title: 'Comparison of positive and negative behaviour entries by recorded disability – last 12 months',
    guidance: nationalGuidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by recorded disability trends (National)',
  },
  'trends-entries-by-ethnicity': {
    title: 'Comparison of positive and negative behaviour entries by ethnicity – last 12 months',
    guidance: nationalGuidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by ethnicity trends (National)',
  },
  'trends-entries-by-religion': {
    title: 'Comparison of positive and negative behaviour entries by religion – last 12 months',
    guidance: nationalGuidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by religion trends (National)',
  },
  'trends-entries-by-sexual-orientation': {
    title: 'Comparison of positive and negative behaviour entries by sexual orientation – last 12 months',
    guidance: nationalGuidanceTrendsEntriesByPc,
    googleAnalyticsCategory: 'Behaviour entries by sexual orientation trends (National)',
  },
  'prisoners-with-entries-by-age': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by age – last 28 days',
    guidance: nationalGuidancePrisonersWithEntriesByPc,
    labelColumn: 'Age',
    googleAnalyticsCategory: 'Behaviour entries by age (National)',
  },
  'prisoners-with-entries-by-disability': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by recorded disability – last 28 days',
    guidance: nationalGuidancePrisonersWithEntriesByPc,
    labelColumn: 'Disability',
    googleAnalyticsCategory: 'Behaviour entries by disability (National)',
    labelColumnWidth: 'wide',
  },
  'prisoners-with-entries-by-ethnicity': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by ethnicity – last 28 days',
    guidance: nationalGuidancePrisonersWithEntriesByPc,
    labelColumn: 'Ethnicity',
    googleAnalyticsCategory: 'Behaviour entries by ethnicity (National)',
    labelColumnWidth: 'wide',
  },
  'prisoners-with-entries-by-religion': {
    title: 'Percentage and number of prisoners receiving each behaviour entry type by religion – last 28 days',
    guidance: nationalGuidancePrisonersWithEntriesByPc,
    labelColumn: 'Religion',
    googleAnalyticsCategory: 'Behaviour entries by religion (National)',
  },
  'prisoners-with-entries-by-sexual-orientation': {
    title:
      'Percentage and number of prisoners receiving each behaviour entry type by sexual orientation – last 28 days',
    guidance: nationalGuidancePrisonersWithEntriesByPc,
    labelColumn: 'Sexual orientation',
    googleAnalyticsCategory: 'Behaviour entries by sexual orientation (National)',
  },
}
