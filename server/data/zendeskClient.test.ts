import nock from 'nock'

import { AgentConfig } from '../config'
import ZendeskClient, { type TicketResponse } from './zendeskClient'

describe('Zendesk client', () => {
  const mockedZendeskApiUrl = 'http://zendesk.local'
  let mockedZendeskApi: nock.Scope
  let mockedZendeskClient: ZendeskClient

  beforeEach(() => {
    mockedZendeskApi = nock(mockedZendeskApiUrl)
    mockedZendeskClient = new ZendeskClient(
      { agent: new AgentConfig(1000), timeout: { deadline: 1000, response: 1000 }, url: mockedZendeskApiUrl },
      'test-user',
      '12345',
    )
  })

  afterEach(() => {
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  it('can post create-ticket request to API', async () => {
    const mockedResponse: TicketResponse = {
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
    mockedZendeskApi.post('/api/v2/tickets.json').reply(201, mockedResponse)

    const request = mockedZendeskClient.createTicket({
      subject: 'subject',
      comment: { body: 'some text' },
      type: 'task',
      tags: ['tag-1', 'tag-2'],
    })
    await expect(request).resolves.toHaveProperty('ticket.id', 123)
  })

  it('checks that API response is a 201', async () => {
    mockedZendeskApi.post('/api/v2/tickets.json').reply(204)

    const request = mockedZendeskClient.createTicket({
      subject: 'subject',
      comment: { body: 'some text' },
      type: 'task',
      tags: ['tag-1', 'tag-2'],
    })
    await expect(request).rejects.toHaveProperty('message', 'Zendesk response not 201')
  })
})
