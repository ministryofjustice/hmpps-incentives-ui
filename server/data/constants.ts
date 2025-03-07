export const transferPrisonId = 'TRN' as const
export type TransferPrisonId = typeof transferPrisonId

export const outsidePrisonId = 'OUT' as const
export type OutsidePrisonId = typeof outsidePrisonId

/** User role needed to record incentive level reviews */
export const maintainPrisonerIncentiveLevelRole = 'ROLE_MAINTAIN_IEP' as const

/** User role needed to manage per-prison incentive level details */
export const managePrisonIncentiveLevelsRole = 'ROLE_MAINTAIN_PRISON_IEP_LEVELS' as const

/** User role needed to manage global incentive level details */
export const manageIncentiveLevelsRole = 'ROLE_MAINTAIN_INCENTIVE_LEVELS' as const

/** User role permitting global search and visibility of other caseloads */
export const globalSearchRole = 'ROLE_GLOBAL_SEARCH' as const

/** User role granting access to information about released people */
export const inactiveBookingsRole = 'ROLE_INACTIVE_BOOKINGS' as const

/** Usernames that will be displayed as "System" instead of looking up their name */
export const SYSTEM_USERS = ['INCENTIVES_API']
