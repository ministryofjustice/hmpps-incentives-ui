export const transferPrisonId = 'TRN' as const
export type TransferPrisonId = typeof transferPrisonId

export const outsidePrisonId = 'OUT' as const
export type OutsidePrisonId = typeof outsidePrisonId

/**
 * All user require role PRISON to access this site
 */
export const userRolePrison = 'ROLE_PRISON' as const

/**
 * Users without global search cannot search outside their active caseload nor link out to profiles outside their caseload set
 */
export const userRoleGlobalSearch = 'ROLE_GLOBAL_SEARCH' as const

/**
 * Users without inactive bookings cannot search for released prisoners nor link out to profiles of those individuals
 */
export const userRoleInactiveBookings = 'ROLE_INACTIVE_BOOKINGS' as const
