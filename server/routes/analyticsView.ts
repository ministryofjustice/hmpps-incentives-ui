// eslint-disable-next-line max-classes-per-file
import { Filtering, PGD_REGION_COLUMN, Query, UrlForLocationFunction } from '../services/analyticsService'
import PgdRegionService, { National } from '../services/pgdRegionService'

type ViewType = 'behaviour-entries' | 'incentive-levels' | 'protected-characteristic'

export class InvalidPgdRegionError extends Error {
  constructor(message?: string) {
    super(message)
  }
}

export class AnalyticsView {
  protected filtering: Query

  protected pgdRegionName: string

  constructor(pgdRegionCode: string | null, activeCaseLoad: string) {
    if (pgdRegionCode) {
      if (pgdRegionCode === National) {
        this.pgdRegionName = National
        this.filtering = Filtering.national()
      } else {
        const pgdRegion = PgdRegionService.getPgdRegionByCode(pgdRegionCode)
        if (!pgdRegion) {
          throw new InvalidPgdRegionError(`PGD region with code '${pgdRegionCode}' found`)
        }

        this.pgdRegionName = pgdRegion.name
        this.filtering = Filtering.byPgdRegion(pgdRegion.name)
      }
    } else {
      this.filtering = Filtering.byPrison(activeCaseLoad)
      this.pgdRegionName = null
    }
  }

  getUrlFunction(view: ViewType): UrlForLocationFunction {
    if (this.isRegional()) {
      // No links from regional charts
      return (_pgdRegion, _prisonId) => null
    }

    if (this.isNational()) {
      // Link to PGD region page
      return (_, regionName) => {
        const pgdRegion = PgdRegionService.getPgdRegionByName(regionName)
        return pgdRegion ? `/analytics/${pgdRegion.code}/${view}` : null
      }
    }

    return linkToIncentiveTable
  }

  getFiltering(): Query {
    return this.filtering
  }

  getPgdRegionName(): string | null {
    return this.pgdRegionName
  }

  isNational(): boolean {
    return this.filtering.filterColumn === null
  }

  isRegional(): boolean {
    return this.filtering.filterColumn === PGD_REGION_COLUMN
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
