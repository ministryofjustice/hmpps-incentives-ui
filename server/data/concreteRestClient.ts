import { ApiConfig, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import Logger from 'bunyan'

export default class ConcreteRestClient extends RestClient {
  constructor(
    name: string,
    config: ApiConfig,
    logger: Logger | Console,
    authenticationClient?: AuthenticationClient | undefined,
  ) {
    super(name, config, logger, authenticationClient)
  }
}
