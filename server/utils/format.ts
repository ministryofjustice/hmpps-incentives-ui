const notNumber = (n: unknown) => typeof n !== 'number' || Number.isNaN(n)

export default {
  date(date: Date) {
    return date
      .toLocaleDateString('en-GB', {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        timeZone: 'Europe/London',
      })
      .replace(',', '')
  },

  thousands(integer: number) {
    if (notNumber(integer)) return '?'
    return Math.round(integer).toLocaleString('en-GB')
  },

  percentage(value: number, total: number) {
    if (value === 0 && total === 0) return '0%'
    if (notNumber(total) || notNumber(value) || total === 0) return '?'
    return `${Math.round((value / total) * 100)}%`
  },
}
