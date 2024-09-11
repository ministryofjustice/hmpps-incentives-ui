export default {}

export declare global {
  /**
   * Replaces nested Date types with string.
   * Needed because api responses over-the-wire are JSON and therefore encode dates as plain strings.
   */
  type DatesAsStrings<T> = T extends Date | null
    ? string | null
    : T extends Date
      ? string
      : T extends Array<infer U>
        ? Array<DatesAsStrings<U>>
        : T extends object
          ? { [k in keyof T]: DatesAsStrings<T[k]> }
          : T
}
