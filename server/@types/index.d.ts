export default {}

export declare global {
  /**
   * Replaces nested Date types with string.
   * Needed because api responses over-the-wire are JSON and therefore encode dates as plain strings.
   * NB: arrays of Date are not supported
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
}
