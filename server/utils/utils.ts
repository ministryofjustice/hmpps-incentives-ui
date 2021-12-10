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

const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

/**
 * Returns the number of days from date
 *
 * @param date date or string representing a date.
 * @returns number of whole days from date.
 */
function daysFrom(date: Date | string): number {
  const from = new Date(date)
  const now = new Date()
  const msElapsed = now.getTime() - from.getTime()

  return Math.trunc(msElapsed / 1_000 / 60 / 60 / 24)
}

export { convertToTitleCase, daysFrom }
