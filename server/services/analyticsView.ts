import type { UrlForLocationFunction } from './analyticsService'
import PgdRegionService, { National, PgdRegion } from './pgdRegionService'

type ViewType = 'behaviour-entries' | 'incentive-levels' | 'protected-characteristic'

type Query = {
  filterColumn: null | 'pgd_region' | 'prison'
  filterValue: string
  groupBy: 'pgd_region' | 'prison' | 'wing'
}

/**
 * Keeps logic for national/regional/by prison view
 *
 * Keeps state of current user analytics view including:
 *  - View type: 'behaviour-entries', 'incentive-levels', etc...
 *  - View level: National, regional or at prison level
 *  - active case load
 *
 * Used by other parts of the application to determine things like:
 * - is this national/regional level?
 * - how links in charts should be constructed
 */
export default class AnalyticsView {
  protected viewLevel: 'national' | 'regional' | 'prison'

  protected viewType: ViewType

  protected pgdRegion: PgdRegion = null

  protected activeCaseLoad: string

  constructor(pgdRegionCode: string | null, viewType: ViewType, activeCaseLoad: string) {
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

    this.viewType = viewType
    this.activeCaseLoad = activeCaseLoad
  }

  linkTo(viewType: ViewType): string {
    let url = '/analytics/'

    if (this.isNational()) {
      url += 'National'
    }
    if (this.isRegional() && this.pgdRegion) {
      url += this.pgdRegion.code
    }

    return `${url}/${viewType}`
  }

  getUrlFunction(): UrlForLocationFunction {
    if (this.isNational()) {
      // Link to PGD region page
      return (_, regionName) => {
        const pgdRegion = PgdRegionService.getPgdRegionByName(regionName)
        return pgdRegion ? `/analytics/${pgdRegion.code}/${this.viewType}` : null
      }
    }

    if (this.isRegional()) {
      // No links from regional charts
      return (_pgdRegion, _prisonId) => null
    }

    return linkToIncentiveTable
  }

  getFiltering(): Query {
    if (this.isNational()) {
      return {
        filterColumn: null,
        filterValue: null,
        groupBy: 'pgd_region',
      }
    }

    if (this.isRegional()) {
      return {
        filterColumn: 'pgd_region',
        filterValue: this.getPgdRegionName(),
        groupBy: 'prison',
      }
    }

    if (this.isPrisonLevel()) {
      return {
        filterColumn: 'prison',
        filterValue: this.activeCaseLoad,
        groupBy: 'wing',
      }
    }

    throw new Error('Unexpected view level, should have been national, regional or prison level')
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

  isPrisonLevel(): boolean {
    return this.viewLevel === 'prison'
  }
}

/**
 * Makes a link from locations in analytics charts to incentives review table
 */
function linkToIncentiveTable(prison: string, location: string): string {
  return `/incentive-summary/${prison}-${location}`
}
