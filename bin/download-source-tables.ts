#!/usr/bin/env npx ts-node
import fs from 'node:fs'
import path from 'node:path'

import config from '../server/config'
import S3Client from '../server/data/s3Client'
import { TableType } from '../server/services/analyticsServiceTypes'

const tableTypes: ReadonlyArray<string> = Object.keys(TableType).sort()

function printHelpAndExit() {
  const scriptName = path.basename(process.argv[1])
  const tableTypeOptions = tableTypes.map(t => `"${t}"`).join(' | ')
  process.stderr.write(
    `Usage: ./${scriptName} [${tableTypeOptions}] [YYYY-MM-DD] [path to save to or '-' for stdout]\n` +
      `NB: Only works on pods within Cloud Platform\n`,
  )
  process.exit(1)
}

const [tableTypeKey, date, savePath] = process.argv.slice(2, 5)
if (process.argv.length !== 5 || !tableTypes.includes(tableTypeKey) || !/^\d\d\d\d-\d\d-\d\d$/.test(date)) {
  printHelpAndExit()
}
const tableType = TableType[tableTypeKey as keyof typeof TableType]
const tableKey = `${tableType}/${date}.json`

const s3Client = new S3Client(config.s3)
s3Client.getObject(tableKey).then(objectContents => {
  if (savePath === '-') {
    process.stdout.write(objectContents)
  } else {
    fs.writeFileSync(savePath, objectContents, { encoding: 'utf8' })
  }
})
