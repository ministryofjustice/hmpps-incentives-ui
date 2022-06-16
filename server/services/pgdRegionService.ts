export const National: string = 'National' as const

export interface PgdRegion {
  name: string
  code: string
}

const pgdRegions = {
  HESG: 'Hertfordshire, Essex and Suffolk Group',
  LTHS: 'Long Term & High Security',
  WE: 'Women’s Estate',
  WM: 'West Midlands',
  // other prison groups
}

export default class PgdRegionService {
  static getAllPgdRegions(): PgdRegion[] {
    return Object.entries(pgdRegions).map(([code, name]) => {
      return { code, name }
    })
  }

  static getPgdRegionByCode(pgdRegionCode: string): PgdRegion {
    const pgdRegionName = pgdRegions[pgdRegionCode]
    if (pgdRegionName) {
      return { code: pgdRegionCode, name: pgdRegionName }
    }

    return null
  }

  static getPgdRegionByName(pgdRegionName: string): PgdRegion {
    // eslint-disable-next-line no-restricted-syntax
    for (const [code, name] of Object.entries(pgdRegions)) {
      if (name === pgdRegionName) {
        return { code, name }
      }
    }

    return null
  }
}
