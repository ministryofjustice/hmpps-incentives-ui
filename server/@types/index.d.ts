/**
 * Replaces all Date types with string.
 * Needed because api responses over-the-wire are JSON and therefore encode dates as plain strings.
 */
type DatesAsStrings<T> = {
  [k in keyof T]: T[k] extends Array<infer U>
    ? Array<DatesAsStrings<U>>
    : T[k] extends Date
      ? string
      : T[k] extends object
        ? DatesAsStrings<T[k]>
        : T[k]
}
