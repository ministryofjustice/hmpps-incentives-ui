import { createReadStream } from 'fs'
import fs from 'fs/promises'
import path from 'path'

import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import type { GetObjectOutput, ListObjectsV2Output } from '@aws-sdk/client-s3'

import type S3Client from '../data/s3Client'
import type { TableType } from '../services/analyticsServiceTypes'

export enum MockTable {
  /** mimics a normal table */
  Sample,
  /** mimics when no table is found */
  Missing,
  /** mimics empty table */
  Empty,
}

function mockResponse(
  tableType: TableType,
  tableResponse: MockTable
): { objectList: { key: string; modified: Date }[]; dataPath?: string } {
  if (tableResponse === MockTable.Missing) {
    return { objectList: [] }
  }
  return {
    objectList: [{ key: `${tableType}/2022-04-11.json`, modified: new Date('2022-04-12T12:00:00Z') }],
    dataPath: path.resolve(
      __dirname,
      `./s3Bucket/${tableType}/${tableResponse === MockTable.Empty ? 'empty' : '2022-04-11'}.json`
    ),
  }
}

/**
 * Mocks the response for the S3Client in this application (for testing the consumers of this client)
 */
export function mockAppS3ClientResponse(
  s3Client: jest.Mocked<S3Client>,
  tableType: TableType,
  tableResponse = MockTable.Sample
) {
  const { objectList, dataPath } = mockResponse(tableType, tableResponse)
  s3Client.listObjects.mockResolvedValue(objectList)
  if (dataPath) {
    s3Client.getObject.mockReturnValue(fs.readFile(dataPath, { encoding: 'utf8' }))
  }
}

/**
 * Mocks the response for the S3Client in the AWS SDK (for testing the S3Client in this application)
 */
export function mockSdkS3ClientReponse(
  send: jest.Mock<Promise<GetObjectOutput | ListObjectsV2Output>, [GetObjectCommand | ListObjectsV2Command]>,
  tableType: TableType,
  tableResponse = MockTable.Sample
) {
  const { objectList, dataPath } = mockResponse(tableType, tableResponse)
  const listObjectsResponse: ListObjectsV2Output = {
    Contents: objectList.map(({ key, modified }) => {
      return { Key: key, LastModified: modified }
    }),
  }
  send.mockImplementation(async command => {
    if (command instanceof ListObjectsV2Command) {
      return listObjectsResponse
    }
    if (command instanceof GetObjectCommand && dataPath) {
      const stream = createReadStream(dataPath)
      return { Body: stream }
    }
    throw new Error('Not implemented')
  })
}
