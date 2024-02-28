import { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'
import type { TicketResponse } from '../../server/data/zendeskClient'

const fakeTicket: TicketResponse = {
  ticket: {
    id: 123,
    type: 'task',
    status: 'open',
    subject: 'subject',
    created_at: '2022-03-28T12:00:00Z',
    updated_at: '2022-03-28T12:03:00Z',
    tags: ['tag-1', 'tag-2'],
    custom_fields: [],
  },
}

export default {
  stubCreateTicket: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: '/zendeskApi/api/v2/tickets.json',
      },
      response: {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: fakeTicket,
      },
    })
  },
}
