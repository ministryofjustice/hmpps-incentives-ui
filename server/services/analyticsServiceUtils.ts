import { TrendsReportRow } from './analyticsServiceTypes'

type BaseReportRow = { label: string }

/**
 * Used to sort rows with locations
 */
export function compareLocations({ label: location1 }: BaseReportRow, { label: location2 }: BaseReportRow) {
  if (location1 === 'All') {
    return -1
  }
  if (location2 === 'All') {
    return 1
  }
  if (location1 === 'Unknown') {
    return 1
  }
  if (location2 === 'Unknown') {
    return -1
  }
  if (location1.length === 1 && location2.length !== 1) {
    return -1
  }
  if (location1.length !== 1 && location2.length === 1) {
    return 1
  }
  return location1.localeCompare(location2)
}

/**
 * Used to sort rows with protected characteristics
 */
export function compareCharacteristics(
  { label: characteristic1 }: BaseReportRow,
  { label: characteristic2 }: BaseReportRow
) {
  if (characteristic1 === 'All') {
    return -1
  }
  if (characteristic2 === 'All') {
    return 1
  }
  if (characteristic1 === 'Unknown') {
    return 1
  }
  if (characteristic2 === 'Unknown') {
    return -1
  }
  if (characteristic1 === 'Other') {
    return 1
  }
  if (characteristic2 === 'Other') {
    return -1
  }
  return characteristic1.localeCompare(characteristic2)
}

/**
 * Used to sort trends table rows
 */
export function compareMonths(
  { month: month1 }: Pick<TrendsReportRow, 'month'>,
  { month: month2 }: Pick<TrendsReportRow, 'month'>
): number {
  if (month1 < month2) {
    return -1
  }
  if (month1 > month2) {
    return 1
  }
  return 0
}

/**
 * Strips prefix from level
 * e.g. "C. Standard" → "Standard"
 */
export function removeLevelPrefix(level: string): string {
  return /^[A-Z]+\.\s+(.*)\s*$/.exec(level)?.[1] || level
}
