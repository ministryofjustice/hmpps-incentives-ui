import { createReadStream } from 'fs'
import fs from 'fs/promises'
import path from 'path'

import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import type { GetObjectOutput, ListObjectsV2Output } from '@aws-sdk/client-s3'

import type S3Client from '../data/s3Client'
import { TableType } from '../services/analyticsServiceTypes'

export enum MockTable {
  /** mimics a normal table */
  Sample,
  /** mimics when no table is found */
  Missing,
  /** mimics empty table */
  Empty,
}

function mockedListObjects(prefix: string, tableResponse: MockTable): { key: string; modified: Date }[] {
  if (tableResponse === MockTable.Missing) {
    return []
  }
  if (prefix === `${TableType.behaviourEntries}/`) {
    return [{ key: `${TableType.behaviourEntries}/2022-04-11.json`, modified: new Date('2022-04-12T12:00:00Z') }]
  }
  if (prefix === `${TableType.incentiveLevels}/`) {
    return [{ key: `${TableType.incentiveLevels}/2022-06-06.json`, modified: new Date('2022-06-06T12:00:00Z') }]
  }
  if (prefix === `${TableType.trends}/`) {
    return [{ key: `${TableType.trends}/2022-05-11.json`, modified: new Date('2022-05-11T21:10:00Z') }]
  }
  throw new Error('Not implemented')
}

function mockedGetObject(key: string, tableResponse: MockTable): string {
  if (tableResponse === MockTable.Missing) {
    throw new Error('Not implemented')
  }
  const [tableType] = key.split('/', 1)
  let fileName = 'empty.json'
  if (tableResponse !== MockTable.Empty) {
    if (tableType === TableType.behaviourEntries) {
      fileName = '2022-04-11.json'
    } else if (tableType === TableType.incentiveLevels) {
      fileName = '2022-06-06.json'
    } else if (tableType === TableType.trends) {
      fileName = '2022-05-11.json'
    } else {
      throw new Error('Not implemented')
    }
  }
  return path.resolve(__dirname, `./s3Bucket/${tableType}/${fileName}`)
}

/**
 * Mocks the response for the S3Client in this application (for testing the consumers of this client)
 */
export function mockAppS3ClientResponse(s3Client: jest.Mocked<S3Client>, tableResponse = MockTable.Sample) {
  s3Client.listObjects.mockImplementation(async prefix => {
    return mockedListObjects(prefix, tableResponse)
  })
  s3Client.getObject.mockImplementation(async key => {
    const dataPath = mockedGetObject(key, tableResponse)
    return fs.readFile(dataPath, { encoding: 'utf8' })
  })
}

/**
 * Mocks the response for the S3Client in the AWS SDK (for testing the S3Client in this application)
 */
export function mockSdkS3ClientReponse(
  send: jest.Mock<Promise<GetObjectOutput | ListObjectsV2Output>, [GetObjectCommand | ListObjectsV2Command]>,
  tableResponse = MockTable.Sample,
) {
  send.mockImplementation(async command => {
    if (command instanceof ListObjectsV2Command) {
      return {
        Contents: mockedListObjects(command.input.Prefix, tableResponse).map(({ key, modified }) => {
          return { Key: key, LastModified: modified }
        }),
      }
    }
    if (command instanceof GetObjectCommand) {
      const dataPath = mockedGetObject(command.input.Key, tableResponse)
      const stream = createReadStream(dataPath)
      return { Body: stream }
    }
    throw new Error('Not implemented')
  })
}
