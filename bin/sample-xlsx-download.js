#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const AdmZip = require('adm-zip')
const nunjucks = require('nunjucks')

const [, scriptPath, outputPath] = process.argv
if (!outputPath) {
  process.stderr.write(`Specify output path:\n$ ${path.basename(scriptPath)} ???\n`)
  process.exit()
}

/*
TODO:
  - totals for row should be added
  - location should be a bold link
  - separate first row from subsequent, possibly with a border, not a blank row
*/

const graphHeading = 'Behaviour entries in the last 28 days'
const graphSubheading = 'Comparison of positive and negative behaviour entries by wing'
const dataSource = 'NOMIS'
const dataDateUpdated = new Date()
const graphColumns = ['Positive', 'Negative']
const graphData = [
  ['All', 82, 279],
  ['1', 13, 58],
  ['2', 5, 47],
  ['3', 24, 64],
  ['4', 10, 53],
  ['5', 13, 2],
  ['6', 5, 14],
  ['7', 12, 33],
  ['H', 0, 0],
  ['SEG', 0, 8],
]

const context = {
  application: 'hmpps-incentives-ui',
  creator: 'HMPPS',
  baseUrl: 'https://incentives-ui-dev.hmpps.service.justice.gov.uk/',
  sheetName: 'Behaviour entries',
  graphHeading,
  graphSubheading,
  dataSource,
  dataDateUpdated,
  graphColumns,
  graphData,
}

const templatePath = path.resolve(__dirname, 'sample-xlsx-download')

const nunjucksEnvironment = nunjucks.configure(templatePath, {
  autoescape: true,
  throwOnUndefined: true,
})
nunjucksEnvironment.addGlobal('now', new Date())
nunjucksEnvironment.addFilter('columnLetter', column => String.fromCharCode(0x40 + column))

const xlsx = new AdmZip()

function renderXmlIn(p, base) {
  fs.readdirSync(p, { encoding: 'utf8', withFileTypes: true }).forEach(entry => {
    if (entry.isFile() && (entry.name.endsWith('.xml') || entry.name.endsWith('.rels'))) {
      const xlsxPath = path.join(base, entry.name)
      const xml = nunjucks.render(xlsxPath, context)
      xlsx.addFile(xlsxPath, Buffer.from(xml), 'utf8')
    } else if (entry.isDirectory()) {
      renderXmlIn(path.join(p, entry.name), path.join(base, entry.name))
    }
  })
}

renderXmlIn(templatePath, '')
xlsx.writeZip(outputPath)
