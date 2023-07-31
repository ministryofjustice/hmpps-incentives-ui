import { Readable } from 'stream'

import type { GetObjectOutput, ListObjectsV2Output } from '@aws-sdk/client-s3'

import S3Client from './s3Client'

const s3 = {
  send: jest.fn().mockReturnThis(),
}

jest.mock('@aws-sdk/client-s3', () => {
  const { GetObjectCommand, ListObjectsV2Command } = jest.requireActual('@aws-sdk/client-s3')
  return {
    S3Client: jest.fn(() => s3),
    GetObjectCommand,
    ListObjectsV2Command,
  }
})

const someDate1 = new Date('2022-03-08T12:00:00Z')
const someDate2 = new Date('2022-03-08T13:00:00Z')

describe('S3Client', () => {
  let s3Client: S3Client

  beforeEach(() => {
    s3Client = new S3Client({ region: 'eu-west-1', bucket: 'test-bucket' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getObject()', () => {
    it('returns an object as a string', async () => {
      const object = Buffer.from('some object')
      const stream = Readable.from(object)
      const awsResponse: GetObjectOutput = { Body: stream }
      s3.send.mockResolvedValue(awsResponse)
      const response = await s3Client.getObject('any-key')
      expect(response).toEqual('some object')
    })
  })

  describe('listObjects()', () => {
    it('returns a list of object keys', async () => {
      const awsResponse: ListObjectsV2Output = {
        Contents: [
          { Key: 'object 1', LastModified: someDate1 },
          { Key: 'object-2', LastModified: someDate2 },
        ],
      }
      s3.send.mockResolvedValue(awsResponse)
      const response = await s3Client.listObjects()
      expect(response).toEqual([
        { key: 'object 1', modified: someDate1 },
        { key: 'object-2', modified: someDate2 },
      ])
    })

    it('returns a list of all object keys when there are more than fits in one response', async () => {
      const awsResponse1: ListObjectsV2Output = {
        Contents: [
          { Key: 'object 1', LastModified: someDate1 },
          { Key: 'object 2', LastModified: someDate1 },
        ],
        IsTruncated: true,
        NextContinuationToken: 'page-2',
      }
      const awsResponse2: ListObjectsV2Output = {
        Contents: [
          { Key: 'object 3', LastModified: someDate2 },
          { Key: 'object 4', LastModified: someDate2 },
        ],
        IsTruncated: false,
      }
      s3.send
        // page 1
        .mockResolvedValueOnce(awsResponse1)
        // page 2
        .mockResolvedValueOnce(awsResponse2)
      const response = await s3Client.listObjects()
      expect(response).toEqual([
        { key: 'object 1', modified: someDate1 },
        { key: 'object 2', modified: someDate1 },
        { key: 'object 3', modified: someDate2 },
        { key: 'object 4', modified: someDate2 },
      ])
    })
  })
})
