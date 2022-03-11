import type { Readable } from 'stream'

import { S3Client as Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

type S3ClientConfig = {
  bucket: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string
}

type ObjectInfo = {
  key: string
  modified: Date
}

export default class S3Client {
  bucket: string

  s3: Client

  constructor({ bucket, endpoint, accessKeyId, secretAccessKey }: S3ClientConfig) {
    this.bucket = bucket
    const credentials =
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
          }
        : undefined
    this.s3 = new Client({
      region: 'eu-west-2',
      credentials,
      endpoint,
      forcePathStyle: true,
    })
  }

  async getObject(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })
    const response = await this.s3.send(command)
    const readableBody = response.Body as Readable
    const chunks: Uint8Array[] = []
    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of readableBody) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks).toString('utf8')
  }

  async listObjects(prefix?: string): Promise<ObjectInfo[]> {
    let nextToken: string | undefined
    const objects: ObjectInfo[] = []
    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        ContinuationToken: nextToken,
      })
      // eslint-disable-next-line no-await-in-loop
      const response = await this.s3.send(command)
      const contents = response.Contents || []
      const results = contents.map(object => {
        return {
          key: object.Key,
          modified: object.LastModified,
        }
      })
      nextToken = response.NextContinuationToken
      objects.push(...results)
    } while (nextToken)
    return objects
  }
}
