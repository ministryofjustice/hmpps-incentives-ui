import fs from 'fs'

const packageData = JSON.parse(fs.readFileSync('./package.json', { encoding: 'utf8' }))
const { buildNumber, gitRef } = fs.existsSync('./build-info.json')
  ? JSON.parse(fs.readFileSync('./build-info.json', { encoding: 'utf8' }))
  : {
      buildNumber: packageData.version,
      gitRef: 'unknown',
    }

export default { buildNumber, gitRef, packageData }
