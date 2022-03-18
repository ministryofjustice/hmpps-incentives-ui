import { createReadStream } from 'fs'
import fs from 'fs/promises'
import path from 'path'

import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import type { GetObjectOutput, ListObjectsV2Output } from '@aws-sdk/client-s3'

import type S3Client from '../data/s3Client'

export function mockAppS3ClientResponse(s3Client: jest.Mocked<S3Client>, tableName: string) {
  s3Client.listObjects.mockResolvedValue([
    {
      key: `${tableName}/2022-03-13.json`,
      modified: new Date('2022-03-14T12:00:00Z'),
    },
  ])
  s3Client.getObject.mockReturnValue(
    fs.readFile(path.resolve(__dirname, `./s3Bucket/${tableName}/2022-03-13.json`), { encoding: 'utf8' })
  )
}

export function mockSdkS3ClientReponse(
  send: jest.Mock<Promise<GetObjectOutput | ListObjectsV2Output>, [GetObjectCommand | ListObjectsV2Command]>,
  tableName: string
) {
  const listObjectsResponse: ListObjectsV2Output = {
    Contents: [{ Key: `${tableName}/2022-03-13.json`, LastModified: new Date('2022-03-14T12:00:00Z') }],
  }
  send.mockImplementation(async command => {
    if (command instanceof ListObjectsV2Command) {
      return listObjectsResponse
    }
    if (command instanceof GetObjectCommand) {
      const stream = createReadStream(path.resolve(__dirname, `../testData/s3Bucket/${tableName}/2022-03-13.json`))
      const getObjectResponse: GetObjectOutput = { Body: stream }
      return getObjectResponse
    }
    throw new Error('Not implemented')
  })
}
