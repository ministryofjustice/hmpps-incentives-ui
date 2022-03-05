#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const [, scriptPath, outputPath] = process.argv
if (!outputPath) {
  process.stderr.write(`Specify output path:\n$ ${path.basename(scriptPath)} ???\n`)
  process.exit()
}

/*
TODO:
  - split table over multiple pages when too long
  - separate first row with a gap from subsequent
  - location should be a bold link
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

const PDFDocument = require('pdfkit')

const palette = ['#5694ca', '#003078', '#28a197', '#fd0', '#d53880', '#00703C']

function pixelsToPoints(px) {
  return (px * 3) / 4
}

class Report {
  constructor(title) {
    this.doc = new PDFDocument({
      pdfVersion: '1.5',
      size: 'A4',
      margins: { top: 72, right: 48, bottom: 72, left: 48 },
      info: {
        Title: title,
        Keywords: 'incentives',
        Author: 'HMPPS',
        Creator: 'Manage incentives',
        Producer: 'https://incentives-ui-dev.hmpps.service.justice.gov.uk/analytics/behaviour-entries',
        CreationDate: new Date(),
      },
    })
    // doc.registerFont(
    //   'GDS Transport Normal',
    //   'node_modules/govuk-frontend/govuk/assets/fonts/light-94a07e06a1-v2.woff2',
    //   'GDS-Transport'
    // )
    // doc.registerFont(
    //   'GDS Transport Bold',
    //   'node_modules/govuk-frontend/govuk/assets/fonts/bold-b542beb274-v2.woff2',
    //   'GDS-Transport'
    // )
    // doc.registerFont(
    //   'GDS Transport Normal',
    //   'node_modules/govuk-frontend/govuk/assets/fonts/light-f591b13f7d-v2.woff',
    //   'GDS-Transport'
    // )
    // doc.registerFont(
    //   'GDS Transport Bold',
    //   'node_modules/govuk-frontend/govuk/assets/fonts/bold-affa96571d-v2.woff',
    //   'GDS-Transport'
    // )
  }

  streamTo(stream) {
    this.doc.pipe(stream)
  }

  endStream() {
    this.doc.end()
  }

  font(sizePx, bold) {
    const family = bold ? 'Helvetica-Bold' : 'Helvetica'
    this.doc.font(family, family, pixelsToPoints(sizePx))
  }

  h1(text) {
    this.font(46, true)
    this.doc.text(text)
    this.doc.moveDown(0.5)
  }

  h2(text) {
    this.font(24, true)
    this.doc.text(text)
    this.doc.moveDown(0.5)
  }

  body(text) {
    this.font(19)
    this.doc.text(text)
    this.doc.moveDown(0.5)
  }

  legend(...cells) {
    const [x, y] = [this.doc.x, this.doc.y]
    let left = x
    cells.forEach(cell => {
      if (cell.text) {
        this.doc.text(cell.text, left + 5, y + pixelsToPoints(5), {})
        left += this.doc.widthOfString(cell.text) + 10
      } else if (cell.colour) {
        this.doc.fillColor(cell.colour)
        this.doc.rect(left, y, 10, 20).fill()
        left += 10
        this.doc.fillColor('#000')
      }
    })
    this.doc.x = x
    this.doc.y = y
    this.doc.moveDown(2)
  }

  table(dataColumns) {
    return new Table(this.doc, dataColumns)
  }
}

class Table {
  constructor(doc, dataColumns) {
    this.doc = doc
    this.origin = [doc.x, doc.y]
    this.width = doc.page.width - doc.x - doc.page.margins.right
    this.height = doc.page.height - doc.y - doc.page.margins.bottom
    this.top = doc.y
    this.dataColumns = dataColumns
    this.textCellPadding = [pixelsToPoints(10), pixelsToPoints(10), pixelsToPoints(10), 0]
  }

  get textColumnWidth() {
    if (this.dataColumns < 3) {
      return 0.13 * this.width
    }
    return (0.5 / (this.dataColumns + 1)) * this.width
  }

  get chartColumnWidth() {
    if (this.dataColumns < 3) {
      return (1 - 0.13 * (this.dataColumns + 1)) * this.width
    }
    return 0.5 * this.width
  }

  drawBorders() {
    const [x, y] = this.origin
    this.doc.fillColor('#505a5f')
    this.doc.rect(x, y, this.width, this.height).stroke()
    for (let i = 0; i <= this.dataColumns; i += 1) {
      const left = x + this.textColumnWidth * (i + 1)
      this.doc
        .moveTo(left, y)
        .lineTo(left, y + this.height)
        .stroke()
    }
    this.doc.fillColor('#000')
    return this
  }

  addRow(data, ...cells) {
    this.top += this.textCellPadding[0]
    const maxHeight = cells.reduce((currentMaxHeight, cell, index) => {
      const layout = {
        width: this.textColumnWidth - this.textCellPadding[1] - this.textCellPadding[3],
        align: 'right',
      }
      const h = this.doc.heightOfString(cell, layout)
      this.doc.text(cell, this.origin[0] + index * this.textColumnWidth, this.top, layout)
      return Math.max(currentMaxHeight, h)
    }, 0)
    if (data) {
      const total = data.reduce((datum1, datum2) => datum1 + datum2)
      if (total !== 0) {
        let chartX = this.origin[0] + (this.dataColumns + 1) * this.textColumnWidth
        const chartHeight = this.doc.heightOfString('Two\nline')
        data.forEach((datum, index) => {
          this.doc.fillColor(palette[index])
          const width = this.chartColumnWidth * (datum / total)
          this.doc.rect(chartX, this.top, width, chartHeight).fill()
          chartX += width
        })
        this.doc.fillColor('#000')
      }
    }
    this.top += maxHeight + this.textCellPadding[2]
    return this
  }
}

const report = new Report(graphHeading)
report.streamTo(fs.createWriteStream(outputPath))

report.h1(graphHeading)
report.h2(graphSubheading)
report.body(`Data source: ${dataSource}\nDate updated: ${dataDateUpdated.toLocaleString()}`)
const legend = []
graphColumns.forEach((column, index) => {
  legend.push({ colour: palette[index] })
  legend.push({ text: column })
})
report.legend(...legend)
const table = report.table(graphColumns.length)
// table.drawBorders()
report.font(16, true)
table.addRow(null, 'Location', ...graphColumns)
report.font(16)
graphData.forEach(([location, ...data]) => {
  const total = data.reduce((datum1, datum2) => datum1 + datum2)
  table.addRow(data, `${location}\n${total}`, ...data.map(datum => {
      if (total === 0) {
        return '0%\n0'
      }
      return `${Math.round((datum / total) * 100)}%\n${datum}`
    })
  )
})

report.endStream()
