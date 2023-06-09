#!/usr/bin/env npx ts-node
import path from 'path'

import config from '../server/config'
import S3Client from '../server/data/s3Client'
import { TableType } from '../server/services/analyticsServiceTypes'

const tableTypes: ReadonlyArray<string> = Object.keys(TableType).sort()

function printHelpAndExit() {
  const scriptName = path.basename(process.argv[1])
  const tableTypeOptions = tableTypes.map(t => `"${t}"`).join(' | ')
  process.stderr.write(`Usage: ./${scriptName} [${tableTypeOptions}]\nNB: Only works on pods within Cloud Platform\n`)
  process.exit(1)
}

const [tableTypeKey] = process.argv.slice(2, 3)
if (process.argv.length !== 3 || !tableTypes.includes(tableTypeKey)) {
  printHelpAndExit()
}
const tableType = TableType[tableTypeKey as keyof typeof TableType]

const s3Client = new S3Client(config.s3)
s3Client.listObjects(tableType).then(objects => {
  const maxKeyLength = objects.reduce((keyLength, object) => Math.max(keyLength, object.key.length), 0)
  objects.forEach(object => {
    process.stdout.write(`${object.key.padEnd(maxKeyLength)}  ${object.modified.toISOString()}\n`)
  })
})
