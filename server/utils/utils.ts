const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

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
  if (typeof pence !== 'number' || isNaN(pence)) {
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
  let matches = undefined
  if (typeof pounds !== 'string' || !pounds || !(matches = currencyInputRE.exec(pounds))) {
    throw Error('Invalid amount input')
  }
  let pence = parseInt(matches[1], 10) * 100
  if (matches[2]) {
    pence += parseInt(matches[2].slice(1), 10)
  }
  if (isNaN(pence)) {
    throw Error('Invalid amount input')
  }
  return pence
}
