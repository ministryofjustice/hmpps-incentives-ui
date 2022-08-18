/**
 * Generic source data from Analytical Platform
 * in columns represented by objects with row number to value maps
 */
export type Table = Record<string, Record<string, number | string>>

/**
 * Name of table sourced from Analytical Platform
 */
export enum TableType {
  behaviourEntriesPrison = 'behaviour_entries_28d',
  behaviourEntriesRegional = 'behaviours_28d_prison',
  behaviourEntriesNational = 'behaviours_28d_pgdregion',
  behaviourEntriesNationalAll = 'behaviours_28d_national',
  incentiveLevels = 'incentives_latest_narrow',
  trends = 'incentives_trends',
}

/**
 * Source data table from Analytical Platform
 */
export interface CaseEntriesTable extends Table {
  pgd_region: Record<string, string>
  prison: Record<string, string>
  prison_name: Record<string, string>
  location_code: Record<string, string>
  location_desc: Record<string, string>
  positives: Record<string, number>
  negatives: Record<string, number>
  // Unused columns; not currently stored in test data:
  // offender_book_id: Record<string, number>
  // behav_profile: Record<string, string>
}

/**
 * Source data table from Analytical Platform
 * NB: must always be filtered by _some_ characteristic to get by-wing aggregates
 */
export interface IncentiveLevelsTable extends Table {
  pgd_region: Record<string, string>
  prison: Record<string, string>
  prison_name: Record<string, string>
  location_code: Record<string, string>
  location_desc: Record<string, string>
  incentive: Record<string, string>
  behaviour_profile: Record<string, string>
  characteristic: Record<string, string>
  charac_group: Record<string, string>
  positives: Record<string, number>
  negatives: Record<string, number>
  // Unused columns; not currently stored in test data:
  // date: Record<string, number>
  // offender_book_id: Record<string, number>
}

/**
 * Source data table from Analytical Platform
 */
export interface TrendsTable extends Table {
  year_month_str: Record<string, string>
  snapshots: Record<string, number>
  pgd_region: Record<string, string>
  prison: Record<string, string>
  prison_name: Record<string, string>
  offenders: Record<string, number>
  incentive: Record<string, string>
  positives: Record<string, number>
  negatives: Record<string, number>
  ethnic_group: Record<string, string>
  age_group_10yr: Record<string, string>
  religion_group: Record<string, string>
  disability: Record<string, string>
  sex_orientation: Record<string, string>
}

/**
 * Type returned by all analytics service functions
 */
export type Report<Row extends Record<string, unknown>> = {
  columns: string[]
  rows: Row[]
  lastUpdated: Date
  dataSource: string
  hasErrors?: boolean
}

/**
 * A row in a report returned
 */
export type BehaviourEntriesByLocation = {
  /** location */
  label: string
  /** link */
  href?: string
  /** number of positive entries, number of negative entries */
  values: [number, number]
}

/**
 * A row in a report returned
 */
export type PrisonersWithEntriesByLocation = {
  /** location */
  label: string
  /** link */
  href?: string
  /** number of prisoners with: positive entries, negative entries, both types of entries, neither type of entry */
  values: [number, number, number, number]
}

/**
 * A row in a report returned
 */
export type PrisonersOnLevelsByLocation = {
  /** location */
  label: string
  /** link */
  href?: string
  /** number of prisoners on each level */
  values: number[]
}

/**
 * A row in a report returned
 */
export type PrisonersOnLevelsByProtectedCharacteristic = {
  /** protected characteristic */
  label: string
  /** link */
  href?: string
  /** number of prisoners on each level */
  values: number[]
}

/**
 * A row in a report returned
 */
export type BehaviourEntriesByProtectedCharacteristic = {
  /** protected characteristic */
  label: string
  /** link */
  href?: string
  /** number of positive entries, number of negative entries */
  values: [number, number]
}

/**
 * A row in a report returned
 */
export type PrisonersWithEntriesByProtectedCharacteristic = {
  /** protected characteristic */
  label: string
  /** link */
  href?: string
  /** number of prisoners on each level */
  values: number[]
}

/**
 * Type returned by all analytics service monthly trends functions
 */
export type TrendsReport = Report<TrendsReportRow> &
  (
    | {
        // when not plotting percentages, the vertical axis title is required
        plotPercentage: false
        verticalAxisTitle: string
      }
    | { plotPercentage: true }
  ) &
  (
    | {
        // when populationIsTotal is true, the monthly trends rows are counting people
        // and percentages are calculated from total prison population
        populationIsTotal: true
      }
    | {
        // when populationIsTotal is false, the monthly trends percentages are instead calculated
        // from each month's values sum
        populationIsTotal: false
        monthlyTotalName: string
        populationTotalName?: string
      }
  )

/**
 * A row in a trends report returned
 */
export type TrendsReportRow = {
  /** in the form 'YYYY-MM' */
  yearAndMonth: string
  population: number
  /** row of values; length matches report columns */
  values: number[]
  /** sum of values */
  total: number
}

/**
 * Characteristics values from IncentiveLevelsTable
 */
export enum ProtectedCharacteristic {
  Ethnicity = 'ethnic_group',
  Age = 'age_group_10yr',
  Religion = 'religion_group',
  Disability = 'disability',
  SexualOrientation = 'sex_orientation',
}

/**
 * Known protected characteristic groups
 * NB: must match source table values
 */
export const Ethnicities = ['Asian or Asian British', 'Black or Black British', 'Mixed', 'White', 'Other'] as const

/**
 * Known protected characteristic groups
 * NB: must match source table values
 */
export const AgeYoungPeople = '15-17' as const
export const Ages = [AgeYoungPeople, '18-25', '26-35', '36-45', '46-55', '56-65', '66+'] as const

/**
 * Known protected characteristic groups
 * NB: must match source table values
 */
export const Religions = ['Buddhist', 'Christian', 'Hindu', 'Jewish', 'Muslim', 'No religion', 'Sikh', 'Other'] as const

/**
 * Known protected characteristic groups
 * NB: must match source table values
 */
export const Disabilities = ['No recorded disability', 'Recorded disability', 'Unknown'] as const

/**
 * Known protected characteristic groups
 * NB: must match source table values
 */
export const SexualOrientations = ['Bisexual', 'Heterosexual', 'Homosexual', 'Other', 'Unknown'] as const

/**
 * Returns list of known groups for given protected characteristic
 */
export function knownGroupsFor(characteristic: ProtectedCharacteristic): ReadonlyArray<string> {
  switch (characteristic) {
    case ProtectedCharacteristic.Ethnicity:
      return Ethnicities
    case ProtectedCharacteristic.Age:
      return Ages
    case ProtectedCharacteristic.Religion:
      return Religions
    case ProtectedCharacteristic.Disability:
      return Disabilities
    case ProtectedCharacteristic.SexualOrientation:
      return SexualOrientations
    default:
      throw new Error('Unknown characteristic')
  }
}

/**
 * Types of errors thrown by the analytics service
 */
export enum AnalyticsErrorType {
  MissingTable,
  MalformedTable,
  EmptyTable,
}

/**
 * Thrown by the analytics service when a categorisable error ocurred
 */
export class AnalyticsError extends Error {
  constructor(readonly type: AnalyticsErrorType, message?: string) {
    super(message)
  }
}
