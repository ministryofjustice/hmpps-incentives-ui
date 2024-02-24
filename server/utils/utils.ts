import moment from 'moment'

import type { ErrorSummaryItem, GovukSelectItem } from '../routes/forms/forms'

/** String solely of whitespace or falsey */
const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name part (first name, last name, middle name, etc.) to title case equivalent,
 * handling double-barreled names correctly (i.e. each part in a double-barreled is converted to title case).
 * @param name name to be converted.
 * @returns name converted to title case.
 */
export const properCaseName = (name: string): string =>
  isBlank(name)
    ? ''
    : name
        .split('-')
        .map(part => (part.length >= 1 ? part[0].toUpperCase() + part.toLowerCase().slice(1) : part))
        .join('-')

/**
 * Converts a full name (or sentence) to title case
 * handling double-barreled names correctly (i.e. each part in a double-barreled is converted to title case).
 */
export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

/** Converts a first name and surname to title case */
export const formatName = (firstName: string, lastName: string): string =>
  [properCaseName(firstName), properCaseName(lastName)].filter(Boolean).join(' ')

/** Convert a full name to initials and final surname */
export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

/** Converts an object with `firstName` and `lastName` to title case */
export const nameOfPerson = (prisoner: { firstName: string; lastName: string }): string =>
  `${convertToTitleCase(prisoner.firstName)} ${convertToTitleCase(prisoner.lastName)}`.trim()

/** Makes a possessive/genitive form of a name/word */
export const possessive = (string: string): string => {
  if (!string) return ''

  return `${string}${string.toLowerCase().endsWith('s') ? '’' : '’s'}`
}

/** Converts a first name and surname to title case, with surname first */
export const putLastNameFirst = (firstName: string, lastName: string): string => {
  if (!firstName && !lastName) return null
  if (!firstName && lastName) return properCaseName(lastName)
  if (firstName && !lastName) return properCaseName(firstName)

  return `${properCaseName(lastName)}, ${properCaseName(firstName)}`
}

/** Number of days elapsed, ignoring time of day */
export const newDaysSince = (date: moment.MomentInput): number =>
  Math.max(Math.floor(moment.duration(moment().startOf('day').diff(moment(date).startOf('day'))).asDays()), 0)

/** Number of days elapsed, ignoring time of day, since `date`; 0 for today or any time in future */
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

/** Matches a currency amount (without £ sign) */
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

/** Format dates to be used in the datepicker component. */
export const formatDateForDatePicker = (
  isoDate: string,
  style: 'short' | 'full' | 'long' | 'medium' = 'long',
): string => {
  if (!isoDate) return ''
  return new Date(isoDate).toLocaleDateString('en-gb', { dateStyle: style })
}

/** Find field error in error summary list */
export const findFieldInErrorSummary = (list: ErrorSummaryItem[], formFieldId: string): { text: string } | null => {
  if (!list) return null
  const item = list.find(error => error.href === `#${formFieldId}`)
  if (item) {
    return {
      text: item.text,
    }
  }
  return null
}

/** Insert an blank default value into a GOV.UK select component `items` list */
export const govukSelectInsertDefault = (
  items: GovukSelectItem[],
  text: string,
  selected = true,
): GovukSelectItem[] => {
  if (!items) return items
  return [
    {
      text,
      value: '',
      selected,
    },
    ...items,
  ]
}

/** Select an item inside a GOV.UK select component `items` list, by value */
export const govukSelectSetSelected = (items: GovukSelectItem[], value: string): GovukSelectItem[] => {
  if (!items) return items
  return items.map(entry => ({
    ...entry,
    selected: entry.value === value,
  }))
}
