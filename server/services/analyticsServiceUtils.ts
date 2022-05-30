import { TrendsReportRow } from './analyticsServiceTypes'

/**
 * Maps each row in a stitched table and sums up totals
 */
export function mapRowsAndSumTotals<
  RowIn extends [string, ...(number | string)[]],
  RowOut extends [string, ...number[]],
>(
  stitchedTable: RowIn[],
  rowMapper: (row: RowIn) => RowOut,
  summedColumnCount: number, // the number of number columns at the end of RowOut
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
 * Maps each row in a stitched table grouping values into months
 */
export function mapRowsForMonthlyTrends<RowIn extends [string, ...(number | string)[]]>(
  stitchedTable: RowIn[],
  rowMapper: (row: RowIn) => { yearAndMonth: string; columnIndex: number; value: number; population: number }[],
  valueCount: number,
): TrendsReportRow[] {
  const groups: Record<string, Omit<TrendsReportRow, 'total'>> = {}
  stitchedTable.forEach(rowIn => {
    rowMapper(rowIn).forEach(({ yearAndMonth, columnIndex, value, population }) => {
      if (typeof groups[yearAndMonth] === 'undefined') {
        groups[yearAndMonth] = {
          yearAndMonth,
          values: Array(valueCount).fill(0),
          population: 0,
        }
      }
      groups[yearAndMonth].values[columnIndex] += value
      groups[yearAndMonth].population += population
    })
  })
  return Object.values(groups).map(({ yearAndMonth, values, population }) => {
    // eslint-disable-next-line no-param-reassign
    population = Math.round(population)
    const total = Math.round(values.reduce((v1, v2) => v1 + v2, 0))
    // eslint-disable-next-line no-param-reassign
    values = values.map(v => Math.round(v))
    return { yearAndMonth, values, population, total }
  })
}

function yearAndMonthString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Ensures that months without data are still present for last 12 months prior to the report month
 */
export function addMissingMonths(reportDate: Date, rows: TrendsReportRow[], valueCount: number) {
  const existingYearsAndMonths = new Set(rows.map(({ yearAndMonth }) => yearAndMonth))

  const monthCounter = new Date(reportDate)
  monthCounter.setDate(1)
  monthCounter.setHours(12, 0, 0, 0)
  for (let monthsAgo = 1; monthsAgo <= 12; monthsAgo += 1) {
    monthCounter.setMonth(monthCounter.getMonth() - 1)
    const yearAndMonth = yearAndMonthString(monthCounter)
    if (!existingYearsAndMonths.has(yearAndMonth)) {
      rows.push({
        yearAndMonth,
        values: Array(valueCount).fill(0),
        total: 0,
        population: 0,
      })
    }
  }

  rows.sort(compareMonths)
}

/**
 * Removes data that is not from last 12 months prior to the report month
 */
export function removeMonthsOutsideBounds(reportDate: Date, rows: TrendsReportRow[]): TrendsReportRow[] {
  const previousMonth = new Date(reportDate)
  previousMonth.setDate(1)
  previousMonth.setHours(12, 0, 0, 0)
  previousMonth.setMonth(previousMonth.getMonth() - 1)
  const latest = yearAndMonthString(previousMonth)

  const yearAgo = new Date(reportDate)
  yearAgo.setDate(1)
  yearAgo.setHours(12, 0, 0, 0)
  yearAgo.setMonth(yearAgo.getMonth() - 12)
  const oldest = yearAndMonthString(yearAgo)

  return rows.filter(({ yearAndMonth }) => yearAndMonth >= oldest && yearAndMonth <= latest)
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
  { label: characteristic2 }: BaseReportRow,
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
  { yearAndMonth: month1 }: Pick<TrendsReportRow, 'yearAndMonth'>,
  { yearAndMonth: month2 }: Pick<TrendsReportRow, 'yearAndMonth'>,
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
 * Strips prefix the data scientists provide in the source table
 * e.g. "C. Standard" → "Standard"
 */
export function removeSortingPrefix(value: string): string {
  return /^[A-Z]+\.\s+(.*)\s*$/.exec(value)?.[1] || value
}
