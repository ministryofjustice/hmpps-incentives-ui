import { TrendsReportRow } from './analyticsServiceTypes'

/**
 * Maps each row in a stitched table and sums up totals
 */
export function mapRowsAndSumTotals<
  RowIn extends [string, ...(number | string)[]],
  RowOut extends [string, ...number[]]
>(
  stitchedTable: RowIn[],
  rowMapper: (row: RowIn) => RowOut,
  summedColumnCount: number // the number of number columns at the end of RowOut
): RowOut[] {
  const groups: Record<string, RowOut> = {}
  const grandTotals: number[] = Array(summedColumnCount).fill(0)
  stitchedTable.forEach(rowIn => {
    const rowOut = rowMapper(rowIn)
    const [groupId, ...rest] = rowOut
    const rowValues = rest as number[]
    if (typeof groups[groupId] === 'undefined') {
      groups[groupId] = rowOut
    } else {
      const group = groups[groupId]
      rowValues.forEach((value, index) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        group[index + 1] += value
      })
    }
    rowValues.forEach((value, index) => {
      grandTotals[index] += value
    })
  })
  const rows = Object.values(groups)
  rows.push(['All', ...grandTotals] as RowOut)
  return rows
}

/**
 * Ensures that months without data are still present for last 12 months (excluding this month)
 */
export function addMissingMonths(rows: TrendsReportRow[], valueCount: number) {
  const month = new Date()
  month.setDate(1)
  month.setHours(12, 0, 0, 0)
  for (let monthsAgo = 1; monthsAgo <= 12; monthsAgo += 1) {
    month.setMonth(month.getMonth() - 1)
    if (
      !rows.some(
        ({ month: someMonth }) =>
          someMonth.getFullYear() === month.getFullYear() && someMonth.getMonth() === month.getMonth()
      )
    ) {
      rows.push({
        month: new Date(month),
        values: Array(valueCount).fill(0),
        total: 0,
        population: 0,
      })
    }
  }
  rows.sort(compareMonths)
}

/**
 * Removes data that is not from last 12 months (excluding this month)
 */
export function removeMonthsOutsideBounds(rows: TrendsReportRow[]): TrendsReportRow[] {
  const previousMonth = new Date()
  previousMonth.setDate(1)
  previousMonth.setHours(12, 0, 0, 0)
  previousMonth.setMonth(previousMonth.getMonth() - 1)
  const latestYear = previousMonth.getFullYear()
  const latestMonth = previousMonth.getMonth()

  const yearAgo = new Date()
  yearAgo.setDate(1)
  yearAgo.setHours(12, 0, 0, 0)
  yearAgo.setMonth(yearAgo.getMonth() - 12)
  const oldestYear = yearAgo.getFullYear()
  const oldestMonth = yearAgo.getMonth()

  return rows.filter(({ month: rowMonth }) => {
    const year = rowMonth.getFullYear()
    const month = rowMonth.getMonth()
    return (
      (year > oldestYear && year < latestYear) ||
      (year === oldestYear && month >= oldestMonth) ||
      (year === latestYear && month <= latestMonth)
    )
  })
}

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
