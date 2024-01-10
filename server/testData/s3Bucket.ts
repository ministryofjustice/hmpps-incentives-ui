import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import type { GetObjectOutput, ListObjectsV2Output } from '@aws-sdk/client-s3'

import type S3Client from '../data/s3Client'
import { TableType } from '../services/analyticsServiceTypes'

const fileDates = {
  [TableType.behaviourEntriesPrison]: new Date('2022-08-04T19:30:00Z'),
  [TableType.behaviourEntriesRegional]: new Date('2022-08-04T19:31:00Z'),
  [TableType.behaviourEntriesNational]: new Date('2022-08-04T19:32:00Z'),
  [TableType.behaviourEntriesNationalAll]: new Date('2022-08-04T19:33:00Z'),
  [TableType.incentiveLevels]: new Date('2022-08-04T19:34:00Z'),
  [TableType.trends]: new Date('2022-08-04T19:35:00Z'),
} as const

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

  const [tableType] = prefix.split('/', 1)
  if (tableType in fileDates) {
    const fileDate = fileDates[tableType as keyof typeof fileDates]
    const fileName = filenameFromDate(fileDate)
    return [{ key: `${tableType}/${fileName}`, modified: fileDate }]
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
    if (tableType in fileDates) {
      const fileDate = fileDates[tableType as keyof typeof fileDates]
      fileName = filenameFromDate(fileDate)
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
export function mockSdkS3ClientResponse(
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

/**
 * Returns the JSON filename for a date
 *
 * e.g. 31st January 2022 => '2022-01-31.json'
 */
function filenameFromDate(date: Date): string {
  const dateStr = date.toISOString().split('T')[0]
  return `${dateStr}.json`
}
