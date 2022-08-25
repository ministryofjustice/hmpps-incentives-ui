/**
 * Prisons known to be in the Youth Custody Service,
 * a subset of Young Offender Institutions.
 * Residents are 15-17 year olds, known as young people at HMPPS.
 * NB: the HMPPS prison register does not reliably report which prisons are in this set.
 * Aside: other Young Offender Institutions have residents aged 18-24, known as young adults at HMPPS.
 */
const youthCustodyServicePrisons: ReadonlyArray<string> = [
  'CKI', // HMYOI Cookham Wood
  // 'FMI', // HMYOI Feltham is technically a YCS but only houses young adults
  'FYI', // HMYOI Feltham A
  'PYI', // HMP/YOI Parc A
  'WNI', // HMYOI Werrington
  'WYI', // HMYOI Wetherby
]

/**
 * Prisons known to be part of the Women’s Estate.
 * Whilst not technically part of the Youth Custody Service,
 * any could potentially have 15-17 year old residents.
 * NB: the HMPPS prison register could be used for this set of prisons.
 */
const womensEstatePrisons: ReadonlyArray<string> = [
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
]

export default class PrisonRegister {
  /**
   * True for prisons where residents may be aged 15 to 17,
   * those known as young people at HMPPS.
   */
  static housesYoungPeople(prison: string): boolean {
    return youthCustodyServicePrisons.includes(prison) || womensEstatePrisons.includes(prison)
  }
}
