/**
 * Generic source data from Analytical Platform
 * in columns represented by objects with row number to value maps
 */
export type Table = Record<string, Record<string, number | string>>

/**
 * Name of table sourced from Analytical Platform
 */
export enum TableType {
  behaviourEntries = 'behaviour_entries_28d',
  incentiveLevels = 'incentives_latest_narrow',
}

/**
 * Source data table from Analytical Platform
 * NB: other unused columns exist
 */
export interface CaseEntriesTable extends Table {
  prison: Record<string, string>
  wing: Record<string, string>
  positives: Record<string, number>
  negatives: Record<string, number>
}

/**
 * Source data table from Analytical Platform
 * NB: must always be filtered by _some_ characteristic to get by-wing aggregates
 * NB: other unused columns exist
 */
export interface IncentiveLevelsTable extends Table {
  prison: Record<string, string>
  wing: Record<string, string>
  incentive: Record<string, string>
  characteristic: Record<string, string>
  charac_group: Record<string, string>
}

/**
 * Type returned by all analytics service functions
 */
export type Report<Row extends Record<string, unknown>> = {
  columns: string[]
  rows: Row[]
  lastUpdated: Date
  dataSource: string
}

/**
 * A row in a report returned
 */
export type BehaviourEntriesByLocation = {
  location: string
  href?: string
  entriesPositive: number
  entriesNegative: number
}

/**
 * A row in a report returned
 */
export type PrisonersWithEntriesByLocation = {
  location: string
  href?: string
  prisonersWithPositive: number
  prisonersWithNegative: number
  prisonersWithBoth: number
  prisonersWithNeither: number
}

/**
 * A row in a report returned
 */
export type PrisonersOnLevelsByLocation = {
  location: string
  href?: string
  prisonersOnLevels: number[]
}

/**
 * A row in a report returned
 */
export type PrisonersOnLevelsByProtectedCharacteristic = {
  characteristic: string
  prisonersOnLevels: number[]
}

/**
 * Characteristics values from IncentiveLevelsTable
 */
export enum ProtectedCharacteristic {
  Ethnicity = 'ethnic_group',
  AgeGroup = 'age_group_10yr',
}

/**
 * Known protected characteristic groups
 */
export const Ethnicities = ['Asian', 'Black', 'Mixed', 'Other', 'White'] as const

/**
 * Known protected characteristic groups
 */
export const AgeGroups = ['15-17', '18-25', '26-35', '36-45', '46-55', '56-65', '66+'] as const

/**
 * Returns list of known groups for given protected characteristic
 */
export function knownGroupsFor(characteristic: ProtectedCharacteristic): ReadonlyArray<string> {
  switch (characteristic) {
    case ProtectedCharacteristic.Ethnicity:
      return Ethnicities
    case ProtectedCharacteristic.AgeGroup:
      return AgeGroups
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
}

/**
 * Thrown by the analytics service when a categorisable error ocurred
 */
export class AnalyticsError extends Error {
  constructor(readonly type: AnalyticsErrorType, message?: string) {
    super(message)
  }
}
