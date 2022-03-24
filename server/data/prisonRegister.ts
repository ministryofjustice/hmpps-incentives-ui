export const youthCustodyServicePrisons: ReadonlyArray<string> = [
  // Youth Custody Service, all YOIs
  // 15-17 year olds - young people
  'CKI', // HMYOI Cookham Wood
  'FYI', // HMYOI Feltham
  'PYI', // HMP/YOI Parc A
  'WNI', // HMYOI Werrington
  'WYI', // HMYOI Wetherby
  // TODO: cannot currently use prison register for this set

  // Other YOIs hold only 18-24 year olds - young adults
  // apart from Feltham which has 2 parts with YCS in one, YAs in the other.
  // Female prisons which could have girls (15-17)

  // Women’s Estate
  'AGI', // HMP/YOI Askham Grange
  'BZI', // HMP/YOI Bronzefield
  'DHI', // HMP/YOI Drake Hall
  'DWI', // HMP/YOI Downview
  'ESI', // HMP/YOI East Sutton Park
  'EWI', // HMP/YOI Eastwood Park
  'FHI', // HMP/YOI Foston Hall
  'LNI', // HMP/YOI Low Newton
  'NHI', // HMP/YOI New Hall
  'PFI', // HMP/YOI Peterborough Female
  'SDI', // HMP/YOI Send
  'STI', // HMP/YOI Styal
  // TODO: can likely use prison register for this set
]
export default class PrisonRegister {
  static isYouthCustodyService(prison: string): boolean {
    return youthCustodyServicePrisons.includes(prison)
  }
}
