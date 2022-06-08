#!/usr/bin/env npx ts-node
import fs from 'fs'
import path from 'path'

import { type Table, TableType } from '../server/services/analyticsServiceTypes'

const tableTypes: ReadonlyArray<string> = Object.keys(TableType).sort()

function printHelpAndExit() {
  const scriptName = path.basename(process.argv[1])
  const tableTypeOptions = tableTypes.map(t => `"${t}"`).join(' | ')
  process.stderr.write(`Usage: ./${scriptName} [${tableTypeOptions}] [path-to-source-JSON]\n`)
  process.exit(1)
}

const [chosenTableType, sourcePath] = process.argv.slice(2, 4)
if (process.argv.length !== 4 || !tableTypes.includes(chosenTableType)) {
  printHelpAndExit()
}
const destPath = path.resolve(
  __dirname,
  `../server/testData/s3Bucket/${TableType[chosenTableType]}/${path.basename(sourcePath)}`,
)

let columnsToKeep: string[]
let rowFilter: (rowIndex: string, table: Table) => boolean
if (chosenTableType === 'behaviourEntries') {
  columnsToKeep = ['prison', 'wing', 'positives', 'negatives']
  rowFilter = () => true
} else if (chosenTableType === 'incentiveLevels') {
  columnsToKeep = [
    'pgd_region',
    'prison',
    'wing',
    'incentive',
    'behaviour_profile',
    'characteristic',
    'charac_group',
    'positives',
    'negatives',
  ]
  const characteristicsToKeep: ReadonlySet<string> = new Set([
    'ethnic_group',
    'age_group_10yr',
    'religion_group',
    'disability',
    'sex_orientation',
  ])
  rowFilter = (rowIndex, table) => characteristicsToKeep.has(table.characteristic[rowIndex] as string)
} else if (chosenTableType === 'trends') {
  columnsToKeep = [
    'year_month_str',
    'snapshots',
    'pgd_region',
    'prison',
    'offenders',
    'incentive',
    'positives',
    'negatives',
    'ethnic_group',
    'age_group_10yr',
    'religion_group',
    'disability',
    'sex_orientation',
  ]
  rowFilter = () => true
} else {
  throw new Error(`Not implemented for: ${chosenTableType}`)
}

process.stderr.write('Reading source table…\n')
const source = fs.readFileSync(sourcePath, { encoding: 'utf8' })
process.stderr.write('Parsing source table…\n')
const sourceTable = JSON.parse(source) as Table

process.stderr.write('Deleting unnecessary columns…\n')
Object.keys(sourceTable)
  .filter(column => !columnsToKeep.includes(column))
  .forEach(columnToDelete => delete sourceTable[columnToDelete])

const prisonsToKeep: ReadonlySet<string> = new Set(['BWI', 'MDI', 'WRI'])
process.stderr.write(`Selecting ${prisonsToKeep.size} prisons…\n`)
const prisonColumn = sourceTable.prison as Record<string, string>
const newPrisonColumn: Record<string, string> = Object.fromEntries(
  Object.entries(prisonColumn).filter(([_rowIndex, prison]) => prisonsToKeep.has(prison)),
)
sourceTable.prison = newPrisonColumn

process.stderr.write('Filtering rows…\n')
const rowIndicesToKeep = Object.keys(newPrisonColumn).filter(rowIndex => rowFilter(rowIndex, sourceTable))
process.stderr.write('Shuffling rows…\n')
for (let i = rowIndicesToKeep.length - 1; i > 0; i -= 1) {
  const j: number = Math.floor(Math.random() * (i + 1))
  ;[rowIndicesToKeep[i], rowIndicesToKeep[j]] = [rowIndicesToKeep[j], rowIndicesToKeep[i]]
}

process.stderr.write('Constructing output table…\n')
const destTable: typeof sourceTable = Object.fromEntries(columnsToKeep.map(column => [column, {}]))
rowIndicesToKeep.forEach((rowIndex, newRowIndex) => {
  columnsToKeep.forEach(column => {
    destTable[column][newRowIndex.toString()] = sourceTable[column][rowIndex]
  })
})
let dest = JSON.stringify(destTable)
columnsToKeep.forEach(column => {
  dest = dest.replace(`"${column}":`, `\n  "${column}":`)
})
dest = dest.slice(0, dest.length - 1)
dest += '\n}\n'
fs.writeFileSync(destPath, dest, { encoding: 'utf8' })
process.stderr.write(`Saved output table to ${destPath}.\n`)
