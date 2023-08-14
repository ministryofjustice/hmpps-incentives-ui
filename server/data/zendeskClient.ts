import Agent, { HttpsAgent } from 'agentkeepalive'
import superagent, { type ResponseError } from 'superagent'

import type { ApiConfig } from '../config'
import logger from '../../logger'
import sanitiseError from '../sanitisedError'

/**
 * Very simplified request to create a Zendesk ticket
 */
export interface CreateTicketRequest {
  subject: string
  comment: { body: string }
  type: 'task'
  tags: string[]
  custom_fields?: { id: number; value: unknown }[]
}

/**
 * Simplified Zendesk ticket response
 */
export interface TicketResponse {
  ticket: {
    id: number
    type: 'task'
    status: string
    created_at: string
    updated_at: string
    subject: string
    tags: string[]
    custom_fields?: { id: number; value: unknown }[]
  }
}

/**
 * Zendesk API client: only actions is to create a ticket
 */
export default class ZendeskClient {
  agent: Agent

  constructor(
    private readonly config: ApiConfig,
    private readonly username: string,
    private readonly token: string,
  ) {
    const agentConfig = { ...config.agent, keepAlive: false }
    this.agent = config.url.startsWith('https') ? new HttpsAgent(agentConfig) : new Agent(agentConfig)
  }

  async createTicket(ticket: CreateTicketRequest): Promise<TicketResponse> {
    logger.info(`Creating Zendesk ticket: ${ticket.subject}`)
    try {
      const response = await superagent
        .post(`${this.config.url}/api/v2/tickets.json`)
        .agent(this.agent)
        .set('content-type', 'application/json')
        .auth(`${this.username}/token`, this.token, { type: 'basic' })
        .send({ ticket })
      if (response.status !== 201) {
        const error: ResponseError = new Error('Zendesk response not 201')
        error.response = response
        throw error
      }
      return response.body
    } catch (error) {
      const sanitisedError = sanitiseError(error)
      logger.error({ ...sanitisedError }, 'Zendesk error')
      throw sanitisedError
    }
  }
}
