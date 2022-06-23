export const National: string = 'National' as const

export interface PgdRegion {
  name: string
  code: string
}

const pgdRegions = {
  ASD: 'Avon and South Dorset',
  BCN: 'Bedfordshire, Cambridgeshire and Norfolk',
  CNTR: 'Contracted',
  CL: 'Cumbria and Lancashire',
  DND: 'Devon and North Dorset',
  EM: 'East Midlands',
  GMMC: 'Greater Manchester, Merseyside and Cheshire',
  HES: 'Hertfordshire, Essex and Suffolk',
  IFNP: 'Immigration and foreign national prisons',
  KSS: 'Kent, Surrey and Sussex',
  LNDN: 'London',
  LTHS: 'Long-term and high security',
  NM: 'North Midlands',
  SC: 'South Central',
  TW: 'Tees and Wear',
  WLS: 'Wales',
  WM: 'West Midlands',
  WMN: 'Women',
  YRKS: 'Yorkshire',
  YCS: 'Youth custody service',
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
