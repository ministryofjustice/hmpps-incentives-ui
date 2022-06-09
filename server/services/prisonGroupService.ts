export const National: string = 'National' as const

export interface PgdRegion {
  name: string
  code: string
  prisons: Prison[]
}

export interface Prison {
  name: string
  code: string
}

const allPrisonGroups: PgdRegion[] = [
  {
    name: 'West Midlands',
    code: 'WM',
    prisons: [
      { name: 'Birmingham (HMP)', code: 'BMI' },
      { name: 'Brinsford (HMP & YOI)', code: 'BSI' },
      { name: 'Featherstone (HMP)', code: 'FSI' },
      { name: 'Hewell (HMP)', code: 'HEI' },
      { name: 'Stafford (HMP)', code: 'SFI' },
      { name: 'Stoke Heath (HMP & YOI)', code: 'SHI' },
      { name: 'Swinfen Hall (HMP & YOI)', code: 'SNI' },
      // taken from design on Miro, there are potentially other WM prisons
    ],
  },
  {
    name: 'Hertfordshire, Essex and Suffolk Group',
    code: 'HESG',
    prisons: [
      { name: 'Chelmsford (HMP & YOI)"', code: 'CDI' },
      // other HESG prisons
    ],
  },
  {
    name: 'Women’s Estate',
    code: 'WE',
    prisons: [
      { name: 'AGI', code: 'AGI' },
      // other women's prisons
    ],
  },
  {
    name: 'Long Term & High Security',
    code: 'LTHS',
    prisons: [
      { name: 'WDI', code: 'WDI' },
      // other LHTS prisons
    ],
  },
  // other prison groups
]

export default class PrisonGroupService {
  static getAllPrisonGroups(): PgdRegion[] {
    return allPrisonGroups
  }

  static getPrisonGroup(prisonGroupCode: string): PgdRegion {
    return this.getAllPrisonGroups().find(pgdRegion => pgdRegion.code === prisonGroupCode)
  }
}
