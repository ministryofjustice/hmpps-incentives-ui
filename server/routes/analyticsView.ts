// eslint-disable-next-line max-classes-per-file
import { Filtering, Query, UrlForLocationFunction } from '../services/analyticsService'
import PgdRegionService, { National, PgdRegion } from '../services/pgdRegionService'

type ViewType = 'behaviour-entries' | 'incentive-levels' | 'protected-characteristic'

export class AnalyticsView {
  protected viewLevel: 'national' | 'regional' | 'prison'

  protected pgdRegion: PgdRegion = null

  protected activeCaseLoad: string

  constructor(pgdRegionCode: string | null, activeCaseLoad: string) {
    if (pgdRegionCode) {
      if (pgdRegionCode === National) {
        this.viewLevel = 'national'
      } else {
        this.viewLevel = 'regional'
        this.pgdRegion = PgdRegionService.getPgdRegionByCode(pgdRegionCode)
      }
    } else {
      this.viewLevel = 'prison'
    }

    this.activeCaseLoad = activeCaseLoad
  }

  getUrlFunction(view: ViewType): UrlForLocationFunction {
    if (this.isNational()) {
      // Link to PGD region page
      return (_, regionName) => {
        const pgdRegion = PgdRegionService.getPgdRegionByName(regionName)
        return pgdRegion ? `/analytics/${pgdRegion.code}/${view}` : null
      }
    }

    if (this.isRegional()) {
      // No links from regional charts
      return (_pgdRegion, _prisonId) => null
    }

    return linkToIncentiveTable
  }

  getFiltering(): Query {
    const filtering = {
      national: Filtering.national(),
      regional: Filtering.byPgdRegion(this.getPgdRegionName()),
      prison: Filtering.byPrison(this.activeCaseLoad),
    }

    return filtering[this.viewLevel]
  }

  isValidPgdRegion(): boolean {
    if (this.isRegional()) {
      return this.pgdRegion !== null
    }

    return true
  }

  getPgdRegionName(): string | null {
    if (this.isRegional() && this.pgdRegion) {
      return this.pgdRegion.name
    }

    return null
  }

  isNational(): boolean {
    return this.viewLevel === 'national'
  }

  isRegional(): boolean {
    return this.viewLevel === 'regional'
  }
}

/**
 * Makes a link from locations in analytics charts to incentives review table
 */
function linkToIncentiveTable(prison: string, location: string): string {
  return `/incentive-summary/${prison}-${location}`
}

export class AnalyticsLinks {
  protected pgdRegionCode: string | null

  constructor(pgdRegionCode: string) {
    this.pgdRegionCode = pgdRegionCode
  }

  linkTo(view: ViewType): string {
    const pgdRegionName = this.pgdRegionCode ? `${this.pgdRegionCode}/` : ''

    return `/analytics/${pgdRegionName}${view}`
  }
}
