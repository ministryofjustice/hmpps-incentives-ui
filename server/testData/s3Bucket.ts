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

/**
 * Mocks the response for the S3Client in this application (for testing the consumers of this client)
 */
export function mockAppS3ClientResponse(
  s3Client: jest.Mocked<S3Client>,
  tableType: TableType,
  tableResponse = MockTable.Sample
) {
  s3Client.listObjects.mockResolvedValue(
    tableResponse === MockTable.Missing
      ? []
      : [{ key: `${tableType}/2022-03-24.json`, modified: new Date('2022-03-25T12:00:00Z') }]
  )
  if (tableResponse !== MockTable.Missing) {
    s3Client.getObject.mockReturnValue(
      fs.readFile(
        path.resolve(
          __dirname,
          `./s3Bucket/${tableType}/${tableResponse === MockTable.Empty ? 'empty' : '2022-03-24'}.json`
        ),
        { encoding: 'utf8' }
      )
    )
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
  const listObjectsResponse: ListObjectsV2Output = {
    Contents:
      tableResponse === MockTable.Missing
        ? []
        : [{ Key: `${tableType}/2022-03-24.json`, LastModified: new Date('2022-03-25T12:00:00Z') }],
  }
  send.mockImplementation(async command => {
    if (command instanceof ListObjectsV2Command) {
      return listObjectsResponse
    }
    if (command instanceof GetObjectCommand && tableResponse !== MockTable.Missing) {
      const stream = createReadStream(
        path.resolve(
          __dirname,
          `../testData/s3Bucket/${tableType}/${tableResponse === MockTable.Empty ? 'empty' : '2022-03-24'}.json`
        )
      )
      return { Body: stream }
    }
    throw new Error('Not implemented')
  })
}
