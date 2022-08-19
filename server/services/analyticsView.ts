import PgdRegionService, { National, type PgdRegion } from './pgdRegionService'
import type { AnalyticsChartContent } from '../routes/analyticsChartsContent'
import {
  BehaviourEntriesChartsContent,
  IncentiveLevelsChartsContent,
  NationalBehaviourEntriesChartsContent,
  NationalIncentiveLevelsChartsContent,
  NationalProtectedCharacteristicsChartsContent,
  ProtectedCharacteristicsChartsContent,
  RegionalBehaviourEntriesChartsContent,
  RegionalIncentiveLevelsChartsContent,
  RegionalProtectedCharacteristicsChartsContent,
} from '../routes/analyticsChartsContent'

type ViewType = 'behaviour-entries' | 'incentive-levels' | 'protected-characteristic'

type Query =
  | {
      filterColumn: null
      filterValue: null
      groupBy: 'pgd_region'
    }
  | {
      filterColumn: 'pgd_region'
      filterValue: string
      groupBy: 'prison'
    }
  | {
      filterColumn: 'prison'
      filterValue: string
      groupBy: 'location_desc'
    }

/**
 * Function returning the URL to a specific location (be it wing, prison or PGD Region)
 *
 * filterValue could be null (for national), a PGD region name or prison ID
 * groupValue could be a PGD region name, a prison ID or a residential location ID
 * for national, regional and prison views respectively
 */
type UrlForLocationFunction = (filterValue: string | null, groupValue: string) => string | null

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

  protected incentiveLevelsChartsContent: Record<string, AnalyticsChartContent>

  protected behaviourEntriesChartsContent: Record<string, AnalyticsChartContent>

  protected protectedCharacteristicsChartsContent: Record<string, AnalyticsChartContent>

  constructor(pgdRegionCode: string | null, viewType: ViewType, activeCaseLoad: string) {
    if (pgdRegionCode) {
      if (pgdRegionCode === National) {
        this.viewLevel = 'national'
        this.incentiveLevelsChartsContent = NationalIncentiveLevelsChartsContent
        this.behaviourEntriesChartsContent = NationalBehaviourEntriesChartsContent
        this.protectedCharacteristicsChartsContent = NationalProtectedCharacteristicsChartsContent
      } else {
        this.viewLevel = 'regional'
        this.pgdRegion = PgdRegionService.getPgdRegionByCode(pgdRegionCode)
        this.incentiveLevelsChartsContent = RegionalIncentiveLevelsChartsContent
        this.behaviourEntriesChartsContent = RegionalBehaviourEntriesChartsContent
        this.protectedCharacteristicsChartsContent = RegionalProtectedCharacteristicsChartsContent
      }
    } else {
      this.viewLevel = 'prison'
      this.incentiveLevelsChartsContent = IncentiveLevelsChartsContent
      this.behaviourEntriesChartsContent = BehaviourEntriesChartsContent
      this.protectedCharacteristicsChartsContent = ProtectedCharacteristicsChartsContent
    }

    this.viewType = viewType
    this.activeCaseLoad = activeCaseLoad
  }

  linkTo(viewType: ViewType): string {
    let url = '/analytics/'

    if (this.isNational) {
      url += 'National/'
    }
    if (this.isRegional && this.pgdRegion) {
      url += `${this.pgdRegion.code}/`
    }

    return `${url}${viewType}`
  }

  getUrlFunction(): UrlForLocationFunction {
    if (this.isNational) {
      // Link to PGD region page
      return (_, regionName) => {
        const pgdRegion = PgdRegionService.getPgdRegionByName(regionName)
        return pgdRegion ? `/analytics/${pgdRegion.code}/${this.viewType}` : null
      }
    }

    if (this.isRegional) {
      // No links from regional charts
      return (_pgdRegion, _prisonId) => null
    }

    return (prison: string, location: string) => {
      if (!location || ['all', 'non-wing', 'unknown'].includes(location.toLowerCase())) {
        // Special locations should never be linked
        return null
      }
      // Link to incentives reviews table
      return `/incentive-summary/${prison}-${location}`
    }
  }

  getFiltering(): Query {
    if (this.isNational) {
      return {
        filterColumn: null,
        filterValue: null,
        groupBy: 'pgd_region',
      }
    }

    if (this.isRegional) {
      return {
        filterColumn: 'pgd_region',
        filterValue: this.pgdRegionName,
        groupBy: 'prison',
      }
    }

    if (this.isPrisonLevel) {
      return {
        filterColumn: 'prison',
        filterValue: this.activeCaseLoad,
        groupBy: 'location_desc',
      }
    }

    throw new Error('Unexpected view level, should have been national, regional or prison level')
  }

  get isValidPgdRegion(): boolean {
    if (this.isRegional) {
      return this.pgdRegion !== null
    }

    return true
  }

  get pgdRegionName(): string | null {
    if (this.isRegional && this.pgdRegion) {
      return this.pgdRegion.name
    }

    return null
  }

  get isNational(): boolean {
    return this.viewLevel === 'national'
  }

  get isRegional(): boolean {
    return this.viewLevel === 'regional'
  }

  get isPrisonLevel(): boolean {
    return this.viewLevel === 'prison'
  }

  get levelForTitle(): string {
    if (this.isPrisonLevel) {
      return 'Prison'
    }

    if (this.isRegional) {
      return this.pgdRegionName
    }

    return 'National'
  }
}
