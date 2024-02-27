const isNumber = (n: unknown): n is number => typeof n === 'number' && !Number.isNaN(n)

export default {
  /** Formats a date, e.g. 22 June 2022, 13:00 */
  date(date: Date): string {
    const formatted = date.toLocaleDateString('en-GB', {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/London',
    })
    return formatted.replace(' at ', ', ')
  },

  /** Formats a date, e.g. 31 October 2021 */
  shortDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/London',
    })
  },

  /** Formats a date, e.g. 31/10/2021 */
  formDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone: 'Europe/London',
    })
  },

  /** Split year-month into parts, e.g. `'2022-05'` becomes `{ year: '2022', month: 'May' }` */
  splitYearAndMonth(yearAndMonth: string): { year: number; month: string } {
    const [year, month] = (yearAndMonth ?? '').split('-')
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return { year: parseInt(year, 10) || undefined, month: months[parseInt(month, 10)] }
  },

  /** Formats number of days ago as a string */
  daysAgo(days: number | null): string | undefined {
    if (days === null || days === undefined) {
      return undefined
    }
    if (days === 1) {
      return '1 day ago'
    }
    return `${days} days ago`
  },

  /** Formats a whole number with comma-separated thousands */
  thousands(integer: number): string {
    if (!isNumber(integer)) return '?'
    return Math.round(integer).toLocaleString('en-GB')
  },

  /** Formats a ratio as a percentage string */
  percentage(value: number, total: number, roundToInteger = true): string {
    if (value === 0 && total === 0) return '0%'
    if (!isNumber(total) || !isNumber(value) || total === 0) return '?'
    let percentage = (value / total) * 100
    if (roundToInteger) {
      percentage = Math.round(percentage)
    } else {
      percentage = Math.round(percentage * 1000) / 1000
    }
    return `${percentage}%`
  },

  /** Format a currency amount into a £-prefixed string, dropping '.00' from the end */
  currencyFromPence(pence: number): string {
    if (!isNumber(pence)) return '?'
    if (pence === 0) return '£0'
    if (pence < 100) return `${Math.floor(pence)}p`
    const formatted = Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      currencySign: 'standard',
      useGrouping: true,
    }).format(pence / 100)
    if (formatted.endsWith('.00')) {
      return formatted.slice(0, -3)
    }
    return formatted
  },
}
