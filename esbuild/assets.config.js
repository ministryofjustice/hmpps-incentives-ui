const path = require('node:path')

const esbuild = require('esbuild')
const { clean } = require('esbuild-plugin-clean')
const { copy } = require('esbuild-plugin-copy')
const manifestPlugin = require('esbuild-plugin-manifest')
const { sassPlugin } = require('esbuild-sass-plugin')
const { globSync } = require('node:fs')

/**
 * Copy additional assets into distribution
 * @type {BuildStep}
 */
const buildAdditionalAssets = buildConfig => {
  return esbuild.build({
    outdir: buildConfig.assets.outDir,
    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: buildConfig.assets.copy,
      }),
    ],
  })
}

/**
 * Build scss and javascript assets
 * @type {BuildStep}
 */
const buildAssets = buildConfig => {
  return esbuild.build({
    entryPoints: buildConfig.assets.entryPoints,
    outdir: buildConfig.assets.outDir,
    entryNames: '[ext]/app.[hash]',
    minify: buildConfig.isProduction,
    sourcemap: !buildConfig.isProduction,
    platform: 'browser',
    target: 'es2018',
    external: ['/assets/*'],
    bundle: true,
    plugins: [
      clean({
        patterns: globSync(buildConfig.assets.clear),
      }),
      manifestPlugin({
        generate: entries =>
          Object.fromEntries(Object.entries(entries).map(paths => paths.map(p => p.replace(/^dist\//, '/')))),
      }),
      sassPlugin({
        quietDeps: true,
        loadPaths: [path.join(process.cwd(), 'node_modules'), process.cwd()],
      }),
    ],
  })
}

/**
 * @param {BuildConfig} buildConfig
 * @returns {Promise}
 */
module.exports = buildConfig => {
  process.stderr.write('\u{1b}[36m→ Building assets…\u{1b}[0m\n')

  return Promise.all([buildAssets(buildConfig), buildAdditionalAssets(buildConfig)])
}
