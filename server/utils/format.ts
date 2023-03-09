const notNumber = (n: unknown) => typeof n !== 'number' || Number.isNaN(n)

export default {
  date(date: Date) {
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

  shortDate(date: Date) {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/London',
    })
  },

  splitYearAndMonth(yearAndMonth: string) {
    const [year, month] = (yearAndMonth ?? '').split('-')
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return { year: parseInt(year, 10) || undefined, month: months[parseInt(month, 10)] }
  },

  daysAgo(days: number | null): string | undefined {
    if (days === null || days === undefined) {
      return undefined
    }
    if (days === 1) {
      return '1 day ago'
    }
    return `${days} days ago`
  },

  thousands(integer: number) {
    if (notNumber(integer)) return '?'
    return Math.round(integer).toLocaleString('en-GB')
  },

  percentage(value: number, total: number, roundToInteger = true) {
    if (value === 0 && total === 0) return '0%'
    if (notNumber(total) || notNumber(value) || total === 0) return '?'
    let percentage = (value / total) * 100
    if (roundToInteger) {
      percentage = Math.round(percentage)
    } else {
      percentage = Math.round(percentage * 1000) / 1000
    }
    return `${percentage}%`
  },
}
