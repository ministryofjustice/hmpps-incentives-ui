import { createReadStream } from 'fs'
import fs from 'fs/promises'
import path from 'path'

import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import type { GetObjectOutput, ListObjectsV2Output } from '@aws-sdk/client-s3'

import type S3Client from '../data/s3Client'
import type { TableType } from '../services/analyticsServiceTypes'

export function mockAppS3ClientResponse(s3Client: jest.Mocked<S3Client>, tableType: TableType, emptyTable = false) {
  s3Client.listObjects.mockResolvedValue([
    {
      key: `${tableType}/2022-03-13.json`,
      modified: new Date('2022-03-14T12:00:00Z'),
    },
  ])
  s3Client.getObject.mockReturnValue(
    fs.readFile(path.resolve(__dirname, `./s3Bucket/${tableType}/${emptyTable ? 'empty' : '2022-03-13'}.json`), {
      encoding: 'utf8',
    })
  )
}

export function mockSdkS3ClientReponse(
  send: jest.Mock<Promise<GetObjectOutput | ListObjectsV2Output>, [GetObjectCommand | ListObjectsV2Command]>,
  tableType: TableType,
  emptyTable = false
) {
  const listObjectsResponse: ListObjectsV2Output = {
    Contents: [{ Key: `${tableType}/2022-03-13.json`, LastModified: new Date('2022-03-14T12:00:00Z') }],
  }
  send.mockImplementation(async command => {
    if (command instanceof ListObjectsV2Command) {
      return listObjectsResponse
    }
    if (command instanceof GetObjectCommand) {
      const stream = createReadStream(
        path.resolve(__dirname, `../testData/s3Bucket/${tableType}/${emptyTable ? 'empty' : '2022-03-13'}.json`)
      )
      return { Body: stream }
    }
    throw new Error('Not implemented')
  })
}
