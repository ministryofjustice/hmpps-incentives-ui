import { AuditServiceFactory } from '@ministryofjustice/hmpps-audit-client'

import createApp from './app'
import config from './config'
import ManageUsersApiClient from './data/manageUsersApiClient'
import UserService from './services/userService'
import logger from '../logger'

const manageUsersApiClient = new ManageUsersApiClient()
const userService = new UserService(manageUsersApiClient)
const auditService = AuditServiceFactory.createInstance(config.sqs.audit, logger)

// eslint-disable-next-line import/prefer-default-export
export const app = createApp(userService, auditService)
