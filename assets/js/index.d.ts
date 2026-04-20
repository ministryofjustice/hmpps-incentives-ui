export type GtagArgs =
  | ['config', string, Record<string, string>?]
  | ['get', string, string, ((field: string) => void)?]
  | ['set', Record<string, string>]
  | ['event', string, Record<string, string>?]

/** Google Analytics version 4 */
declare global {
  // eslint-disable-next-line vars-on-top
  var gtag: (...args: GtagArgs) => void
}
