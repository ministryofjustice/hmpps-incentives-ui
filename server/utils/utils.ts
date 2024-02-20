import moment from 'moment'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const formatName = (firstName: string, lastName: string): string =>
  [properCaseName(firstName), properCaseName(lastName)].filter(Boolean).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const nameOfPerson = (prisoner: { firstName: string; lastName: string }): string =>
  `${convertToTitleCase(prisoner.firstName)} ${convertToTitleCase(prisoner.lastName)}`.trim()

export const possessive = (string: string): string => {
  if (!string) return ''

  return `${string}${string.toLowerCase().endsWith('s') ? '’' : '’s'}`
}

export const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const putLastNameFirst = (firstName: string, lastName: string): string => {
  if (!firstName && !lastName) return null
  if (!firstName && lastName) return properCaseName(lastName)
  if (firstName && !lastName) return properCaseName(firstName)

  return `${properCaseName(lastName)}, ${properCaseName(firstName)}`
}

/** Number of days elapsed, ignoring time of day, since `date`; 0 for today or any time in future */
export const newDaysSince = (date: moment.MomentInput): number =>
  Math.max(Math.floor(moment.duration(moment().startOf('day').diff(moment(date).startOf('day'))).asDays()), 0)

export const daysSince = (date: Date): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayUnix = today.valueOf()
  date.setHours(0, 0, 0, 0)
  const dateUnix = date.valueOf()
  if (dateUnix >= todayUnix) {
    return 0
  }
  return Math.round((todayUnix - dateUnix) / (1000 * 60 * 60 * 24))
}

export const formatDateForDatePicker = (
  isoDate: string,
  style: 'short' | 'full' | 'long' | 'medium' = 'long',
): string => {
  if (!isoDate) return ''

  return new Date(isoDate).toLocaleDateString('en-gb', { dateStyle: style })
}

/**
 * Converts a numeric amount of pence into a string of pounds and pence, excluding the £ symbol.
 * Used to pre-fill currency text inputs from internal money representation.
 */
export function penceAmountToInputString(pence: number): string {
  if (typeof pence !== 'number' || Number.isNaN(pence)) {
    throw Error('Invalid amount input')
  }
  const pounds = Math.floor(pence / 100)
  const fractional = `${pence % 100}`.padStart(2, '0')
  return `${pounds}.${fractional}`
}

export const currencyInputRE = /^(\d+)(\.\d\d)?$/

/**
 * Parses user input of pounds and pence, excluding £ symbol, to get numeric representation in pence.
 */
export function inputStringToPenceAmount(pounds: string): number {
  if (typeof pounds !== 'string' || !pounds) {
    throw Error('Invalid amount input')
  }
  const matches = currencyInputRE.exec(pounds)
  if (!matches) {
    throw Error('Invalid amount input')
  }
  let pence = parseInt(matches[1], 10) * 100
  if (matches[2]) {
    pence += parseInt(matches[2].slice(1), 10)
  }
  if (Number.isNaN(pence)) {
    throw Error('Invalid amount input')
  }
  return pence
}
